import { useSessionInfo } from "../../../hooks";
import { PRICE_DELIVERY_POCHTA } from "../../../app/constants/constants.price";
import { createInlineKeyboard } from "../../../utils";
import { paymentService } from "../../../services/paymentService";
import { TBotContext, TContextPrintType } from "../../../app/types";
import { getPrintTypeName } from "../../../features/getPrintTypeName";
import { checkPaymentStatus } from "./checkPaymentStatus";
import { IS_DEVELOPMENT_MODE } from "../../../app/constants/constants.settings";
import {
  orderConfirmCardTemplate,
  orderConfirmCertificateOverPriceTemplate,
  orderConfirmCertificateTemplate,
} from "../../../template/order.template";
import { consoleLogWithTime } from "../../../utils/consoleLogWithTime";
import { useGlobalState } from "../../../hooks/useGlobalState";
import { CREATE_ORDER_CERTIFICATE_ROUTE } from "../../../configs/routes";
import { CertificateEnum } from "../../../app/types/certificateType";
import { useOrderResult } from "../../../hooks/useOrderResult";

const paymentCard = async (ctx: TBotContext) => {
  const { getPhotoInfo, getDeliveryInfo, getOrderInfo } = useSessionInfo(ctx);
  const { totalPricePhoto, totalPriceWithDelivery, freePhoto } =
    useOrderResult(ctx);

  const { deletePaymentLink } = useGlobalState(ctx);

  const printType = getPhotoInfo()?.type!;
  const photosCount = getPhotoInfo()?.count!;
  const isFreeDelivery =
    getOrderInfo()?.certificate?.type === CertificateEnum.freeDelivery;

  const phone = getDeliveryInfo()?.phone;

  const response = await paymentService.createPayment(
    ctx,
    totalPriceWithDelivery,
    phone!,
  );

  if (response) {
    await deletePaymentLink(); // удаляем сообщение со ссылкой на оплату

    consoleLogWithTime(
      `🚀 Сформировали ссылку на оплату: ${response?.orderId}`,
      ctx,
    );

    await ctx.replyWithHTML(
      orderConfirmCardTemplate({
        photosCount,
        printType,
        printTypeName: getPrintTypeName[printType as TContextPrintType],
        pricePhoto: totalPricePhoto,
        priceDelivery: isFreeDelivery ? 0 : PRICE_DELIVERY_POCHTA,
        totalPrice: totalPriceWithDelivery,
        giftCount: Number(freePhoto) || undefined,
      }),
      createInlineKeyboard([
        {
          label: `Оплатить ${response.price} руб.`,
          type: "url",
          action: response.formUrl,
        },
      ] as any),
    );

    if (IS_DEVELOPMENT_MODE) {
      // использовать только для теста
      await checkPaymentStatus(ctx);
    }
  }
};

const paymentCertificate = async (ctx: TBotContext) => {
  const { getPhotoInfo, getOrderInfo, getDeliveryInfo } = useSessionInfo(ctx);
  const { totalPricePhoto } = useOrderResult(ctx);

  const printType = getPhotoInfo()?.type!;
  const photosCount = getPhotoInfo()?.count!;
  const photosCountCertificate = getOrderInfo()?.certificate?.count;

  if (totalPricePhoto) {
    const overCount = photosCount - photosCountCertificate!;

    const phone = getDeliveryInfo()?.phone;

    const response = await paymentService.createPayment(
      ctx,
      totalPricePhoto,
      phone!,
    );

    if (response) {
      consoleLogWithTime(
        `🚀 Сформировали ссылку на оплату OVER_COUNT: ${response?.orderId}`,
        ctx,
      );

      await ctx.replyWithHTML(
        orderConfirmCertificateOverPriceTemplate({
          certificateCount: photosCountCertificate!,
          photosCount,
          printType,
          printTypeName: getPrintTypeName[printType as TContextPrintType],
          overCount,
          totalPrice: totalPricePhoto,
        }),
        createInlineKeyboard([
          {
            label: `Оплатить ${response.price} руб.`,
            type: "url",
            action: response.formUrl,
          },
        ] as any),
      );

      if (IS_DEVELOPMENT_MODE) {
        // использовать только для теста
        await checkPaymentStatus(ctx);
      }
    }
  } else {
    await ctx.replyWithHTML(
      orderConfirmCertificateTemplate({
        photosCount,
        printTypeName: getPrintTypeName[printType as TContextPrintType],
      }),
      createInlineKeyboard([
        {
          label: "Подтвердить заказ",
          action: CREATE_ORDER_CERTIFICATE_ROUTE,
        },
      ] as any),
    );
  }
};

export const confirmAndPay = async (ctx: TBotContext) => {
  const { getOrderInfo } = useSessionInfo(ctx);
  const paymentType = getOrderInfo()?.method;
  const certificateType = getOrderInfo()?.certificate?.type;

  if (
    paymentType === "certificate" &&
    certificateType === CertificateEnum.certificate
  ) {
    await paymentCertificate(ctx);
    return;
  }

  await paymentCard(ctx);
  return;
};
