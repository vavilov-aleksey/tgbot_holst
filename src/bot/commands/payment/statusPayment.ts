import {
  OrderStatusEnum,
  paymentService,
} from "../../../services/paymentService";
import { createInlineKeyboard } from "../../../utils";
import { PAYMENT_STATUS } from "../../../configs/routes";
import { createFolderForUserInfo } from "../../../features/createFolderForUserInfo";
import { useSessionInfo } from "../../../hooks";
import { TBotContext } from "../../../app/types";
import { IS_DEVELOPMENT_MODE } from "../../../app/constants/constants.settings";
import { getTimeStamp } from "../../../utils/getTimeStamp";
import { getPrintTypeName } from "../../../features/getPrintTypeName";
import { googleReportService } from "../../../services/Google/GoogleReportService";
import { googleCertificateService } from "../../../services/Google/GoogleCertificateService";
import { CertificateEnum } from "../../../app/types/certificateType";
import { registerDelivery } from "./registerDelivery";

export const runPostPaymentProcessing = async (ctx: TBotContext) => {
  const { setIsGlobalLoading, getOrderInfo } = useSessionInfo(ctx);

  try {
    if (!IS_DEVELOPMENT_MODE) {
      await registerDelivery(ctx);
    }

    await createFolderForUserInfo(ctx);

    const certificateRowGoogle = getOrderInfo()?.certificate?.rowInGoogle;

    if (certificateRowGoogle) {
      if (getOrderInfo()?.certificate?.type !== CertificateEnum.bonusPerValue) {
        await googleCertificateService.setCertificateDateUsage(
          certificateRowGoogle,
        );
      }
    }
  } catch (error) {
    console.error("Post-payment processing error:", error);
  } finally {
    await setIsGlobalLoading(false);
  }
};

// только для теста
export const statusPayment = async (ctx: TBotContext) => {
  const { setIsGlobalLoading } = useSessionInfo(ctx);

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery();
  }

  await setIsGlobalLoading(true);

  let runsInBackground = false;

  try {
    const data = await paymentService.statusPayment(ctx);

    if (data.OrderStatus === OrderStatusEnum.successPayment) {
      const { setPaymentInfo } = useSessionInfo(ctx);
      await successStatusText(ctx, data.Amount);

      await saveReportGoogle(ctx, {
        orderId: "ТЕСТОВЫЙ ЗАКАЗ",
        amount: data.Amount / 100,
        date: getTimeStamp(),
      });

      setPaymentInfo({
        orderId: data.OrderNumber,
        sum: data.Amount / 100,
      });

      runsInBackground = true;
      void runPostPaymentProcessing(ctx);
      return;
    }

    if (data.OrderStatus === OrderStatusEnum.register) {
      await registerStatusText(ctx);
    }

    if (data.OrderStatus === OrderStatusEnum.decline) {
      await declineStatusText(ctx);
    }
  } catch (error) {
    console.error("statusPayment error:", error);
    throw error;
  } finally {
    if (!runsInBackground) {
      await setIsGlobalLoading(false);
    }
  }
};

export const successStatusPayment = async (
  ctx: TBotContext,
  amount: number,
  paymentDate: string,
) => {
  const { setPaymentInfo, setIsGlobalLoading } = useSessionInfo(ctx);
  await setIsGlobalLoading(true);
  setPaymentInfo({ paymentDate });

  await successStatusText(ctx, amount);
  void runPostPaymentProcessing(ctx);
};

export const saveReportGoogle = async (
  ctx: TBotContext,
  data: {
    amount: number;
    date: string;
    orderId: string;
  },
) => {
  const { getDeliveryInfo, getReferrerLink, getPhotoInfo, getOrderInfo } =
    useSessionInfo(ctx);

  const typeOrder = getOrderInfo()?.certificate?.type;
  const numberCertificate = getOrderInfo()?.certificate?.number;
  const countGift = getOrderInfo()?.certificate?.count;

  const textOrderId = () => {
    if (typeOrder === CertificateEnum.certificate) {
      return `${data.orderId}\nСертификат на ${countGift}, ${numberCertificate}`;
    }
    if (typeOrder === CertificateEnum.freeGift) {
      return `${data.orderId}\nПодарок на ${countGift}, ${numberCertificate}`;
    }
    if (typeOrder === CertificateEnum.freeDelivery) {
      return `${data.orderId}\nПодарок доставка, ${numberCertificate}`;
    }
    if (typeOrder === CertificateEnum.bonusPerValue) {
      return `${data.orderId}\nПодарок по бонусу за 100 фото, ${numberCertificate}`;
    }
    return `${data.orderId}`;
  };

  // записывать в отчет
  await googleReportService.addReport({
    userId: ctx?.from?.id!,
    price: data.amount,
    date: data.date,
    orderId: textOrderId(),
    phone: getDeliveryInfo()?.phone!,
    countPhoto: getPhotoInfo()?.count!,
    typePhoto: getPrintTypeName[getPhotoInfo()?.type!],
    index: getDeliveryInfo()?.index!,
    userName: getDeliveryInfo()?.userName!,
    referrerLink: getReferrerLink()!,
  });
};

const successStatusText = async (ctx: TBotContext, amount: number) => {
  await ctx.replyWithHTML(`🎉 <b>Оплата успешно завершена!</b>

  ✔ Ваш платеж на сумму <b>${+amount / 100} руб</b> получен
  ✔ Заказ передан в обработку
  ✔ Ожидайте Трек-номер для отслеживания посылки

  Спасибо за покупку!`);
};

const registerStatusText = async (ctx: TBotContext) => {
  await ctx.replyWithHTML(
    `🔄 <b>Статус платежа проверяется</b>

Наш платежный сервис еще не получил финальное подтверждение. Это может занять 3-5 минут.

Что можно сделать:
• Подождите и проверьте снова через пару минут 👇

Мы уже делаем все возможное для обработки вашего платежа!`,
    createInlineKeyboard([
      { label: "Проверить оплату", action: PAYMENT_STATUS } as any,
    ]),
  );
};

const declineStatusText = async (ctx: TBotContext) => {
  const { getPaymentInfo, getDeliveryInfo } = useSessionInfo(ctx);

  const sum = getPaymentInfo()?.sum!;

  const response = await paymentService.createPayment(
    ctx,
    sum,
    getDeliveryInfo()?.phone!,
  );

  if (response) {
    await ctx.replyWithHTML(
      `❌ <b>Оплата не прошла</b>

  К сожалению, мы не получили подтверждение платежа. Возможные причины:
  • Истекло время на оплату
  • Недостаточно средств на карте
  • Превышен лимит операций
  • Техническая ошибка банка

  Пожалуйста:
  1. Проверьте баланс карты
  2. Попробуйте оплатить снова`,
      createInlineKeyboard([
        {
          label: `Оплатить ${sum} руб.`,
          type: "url",
          action: response.formUrl,
        },
      ] as any),
    );
  }

  // await checkPaymentStatus(ctx);
};

export const declinedByTimeoutStatusText = async (ctx: TBotContext) => {
  // await ctx.replyWithHTML(
  //   `⌛ <b>Время оплаты истекло</b>
  //
  // К сожалению, мы не получили подтверждение оплаты.
  //
  // Пожалуйста:
  // 1. Нажмите кнопку <b>"Продолжить"</b> ниже`,
  //   createInlineKeyboard([
  //     { label: "Продолжить", action: PAYMENT_CONFIRM_AND_PAY },
  //   ]),
  // );
};
