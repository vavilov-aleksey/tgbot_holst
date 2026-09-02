import axios, { AxiosInstance, AxiosResponse } from "axios";
import { GetEnvKey } from "../features/getEnvKey";
import { useSessionInfo } from "../hooks";
import { createInlineKeyboard } from "../utils";
import { v4 as uuidv4 } from "uuid";
import { PAYMENT_CONFIRM_AND_PAY } from "../configs/routes";
import { TBotContext } from "../app/types";
import { CERTIFICATE_NAME } from "../app/constants/constants.certificate";
import { consoleLogWithTime } from "../utils/consoleLogWithTime";
import { ADMIN_ID, SUPER_ADMIN_ID } from "../app/constants/constants.settings";

// import * as https from "node:https";

export enum OrderStatusEnum {
  register = 0, // Заказ зарегистрирован, но не оплачен.
  successPayment = 2, // Проведена полная авторизация суммы заказа.
  cancel = 3, // Авторизация отменена.
  noName = 5, // Инициирована авторизация через ACS банка-эмитента.
  decline = 6, // Авторизация отклонена.
}

type ResponseRegisterType = {
  orderId?: string;
  formUrl?: string;
  errorCode?: string;
  errorMessage?: string;
};

type PaymentConfig = {
  baseURL: string;
  token: string;
  returnUrl: string;
  callbackUrl: string;
};

type RegisterPaymentParams = {
  orderNumber: string;
  amount: number;
  phoneNumber: string;
};

// ------
class PaymentService {
  private readonly config: PaymentConfig;
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    const env = new GetEnvKey();

    this.config = {
      baseURL: env.get("ALFA_BANK_URL"),
      token: env.get("ALFA_BANK_TOKEN"),
      returnUrl: env.get("URL_TG_BOT"),
      callbackUrl: env.get("ALFA_BANK_CALLBACK_URL"),
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      headers: { Authorization: this.config.token },
      // только для локальной разработки
      // httpsAgent: new https.Agent({
      //   rejectUnauthorized: true,
      // }),
    });
  }

  private async createPaymentCommon(
    params: RegisterPaymentParams,
    userId: number,
  ): Promise<{ orderId: string; formUrl: string; price: number } | null> {
    const { orderNumber, amount, phoneNumber } = params;

    const isTestUser = [ADMIN_ID, SUPER_ADMIN_ID].includes(String(userId));

    const finalAmount = isTestUser ? 1 : amount;

    try {
      const response: AxiosResponse<ResponseRegisterType> =
        await this.axiosInstance.get("/payment/rest/register.do", {
          params: {
            token: this.config.token,
            orderNumber,
            amount: finalAmount * 100, // количество в копейках
            returnUrl: this.config.returnUrl,
            dynamicCallbackUrl: this.config.callbackUrl,
            sessionTimeoutSecs: 600, // время жизни ссылки. В секундах. максимум 20минут. 600 === 10минут
            description: `Номер телефона: ${phoneNumber}`,
            jsonParams: JSON.stringify({ typePayment: "tg_bot_holst" }),
          },
        });

      const { data } = response;

      if (data?.errorCode) {
        throw new Error(data.errorMessage || `Error code: ${data.errorCode}`);
      }

      const { orderId, formUrl } = data;

      if (orderId && formUrl) {
        return {
          orderId,
          formUrl,
          price: finalAmount,
        };
      }

      return null;
    } catch (e) {
      console.log("Error register payment payment: ", e, params);
      throw e;
    }
  }

  async createPayment(
    ctx: TBotContext,
    amount: number,
    phone: string,
  ): Promise<{ orderId: string; formUrl: string; price: number } | null> {
    const uniqueId = uuidv4().substring(0, 10);
    const { setPaymentInfo } = useSessionInfo(ctx);

    try {
      const result = await this.createPaymentCommon(
        {
          orderNumber: `tg_holst_${uniqueId}_${ctx?.from?.id}`,
          amount: amount,
          phoneNumber: phone,
        },
        ctx?.from?.id!,
      );

      if (result) {
        setPaymentInfo({ orderId: result.orderId, sum: result.price });
        return result;
      }

      return result;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      consoleLogWithTime("🚫 Ошибка при создании заказа", ctx);
      await ctx.replyWithHTML(
        `🚫 <b>Ой, произошла ошибка при создании заказа!</b>\n${error}\n\nПопробуйте ещё раз, нажав на кнопку "Оформить заказ"👇`,
        createInlineKeyboard([
          { label: "Оформить заказ", action: PAYMENT_CONFIRM_AND_PAY },
        ]),
      );
      return null;
    }
  }

  async registerPaymentCert(
    ctx: TBotContext,
    amount: number,
  ): Promise<{ orderId: string; formUrl: string; price: number } | null> {
    const uniqueId = uuidv4().substring(0, 5);
    const { certificateInfo } = useSessionInfo(ctx);

    try {
      const result = await this.createPaymentCommon(
        {
          orderNumber: `tg_holst_${uniqueId}_${CERTIFICATE_NAME}_${ctx?.from?.id}`,
          amount,
          phoneNumber: certificateInfo?.phone!,
        },
        ctx?.from?.id!,
      );

      return result;
    } catch (error) {
      console.error("Произошла ошибка при создании заказа: ", error);
      await ctx.replyWithHTML(
        `🚫 <b>Ой, произошла ошибка при создании заказа!</b>\n\nПопробуйте ещё раз.`,
      );
      return null;
    }
  }

  // используем только в тестировании
  async statusPayment(ctx: TBotContext): Promise<any> {
    const { getPaymentInfo } = useSessionInfo(ctx);
    const orderId = getPaymentInfo()?.orderId;

    if (!orderId) {
      throw new Error("Order ID not found in session");
    }

    try {
      const response = await this.axiosInstance.get(
        "/payment/rest/getOrderStatus.do",
        {
          params: {
            token: this.config.token,
            orderId,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Error checking payment status:", error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
