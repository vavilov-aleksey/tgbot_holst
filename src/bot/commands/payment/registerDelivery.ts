import { TBotContext } from "../../../app/types";
import { useSessionInfo } from "../../../hooks";
import { successOrderCdek } from "../../../template/sucessPayment";
import { createInlineKeyboard } from "../../../utils";
import { TRACKING_CDEK_TRACKING_URL } from "../../../app/constants/constants.tracking";
import { CdekService } from "../../../services/Cdek/CdekService";
import { WEIGHT_PHOTO } from "../../../app/constants/constants.order";
import { googleCdekInfoService } from "../../../services/Google/GoogleCdekInfoService";
import { consoleLogWithTime } from "../../../utils/consoleLogWithTime";

export const registerDelivery = async (ctx: TBotContext) => {
  await registerCdek(ctx);
};

// все для сдека
const ORDER_STATUS_RETRY_MS = 2000;
const ORDER_STATUS_RETRY_COUNT = 8;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForCdekNumber = async (service: CdekService, orderUuid: string) => {
  for (let attempt = 1; attempt <= ORDER_STATUS_RETRY_COUNT; attempt++) {
    const orderInfo = await service.getInfoOrderById(orderUuid);
    const cdekNumber = orderInfo?.entity?.cdek_number;

    if (cdekNumber) {
      return cdekNumber;
    }

    await sleep(ORDER_STATUS_RETRY_MS);
  }

  throw new Error("СДЭК еще не присвоил номер заказа, попробуйте чуть позже.");
};

const saveInfoForCdek = async (ctx: TBotContext, orderUuid: string) => {
  try {
    const cdekService = new CdekService();
    const { getDeliveryInfo, getPhotoInfo, getPaymentInfo } =
      useSessionInfo(ctx);

    const paymentAmount = getPaymentInfo()?.sum!;

    const printInfo = await cdekService.getInfoOrderById(orderUuid);

    await googleCdekInfoService.addInfo({
      userId: ctx?.from?.id!,
      price: paymentAmount,
      phone: getDeliveryInfo()?.phone!,
      countPhoto: getPhotoInfo()?.count!,
      deliveryPayment: printInfo?.entity?.delivery_detail?.total_sum!,
    });
  } catch (e) {
    consoleLogWithTime("Не сохранили данные в гугл док для сдек", ctx);
  }
};

const registerCdek = async (ctx: TBotContext) => {
  const cdekService = new CdekService();

  const {
    getDeliveryInfo,
    getPaymentInfo,
    setTrackNumber,
    setPochtaOrderNumber,
    getPhotoInfo,
  } = useSessionInfo(ctx);

  const orderNumber = getPaymentInfo()?.orderId!;
  const weightPhoto = Math.round(WEIGHT_PHOTO * getPhotoInfo()?.count!);

  const { idPvz, cityCodePvz, phone, userName } = getDeliveryInfo();
  try {
    const createOrderInfo = await cdekService.createSimpleOrder({
      deliveryPoint: idPvz!,
      deliveryPointCityCode: cityCodePvz!,
      phone: phone!,
      recipientName: userName!,
      orderNumber,
      weight: weightPhoto,
    });
    const orderUuid = createOrderInfo?.entity?.uuid;

    if (!orderUuid) {
      throw new Error("СДЭК не вернул UUID созданного заказа.");
    }

    const cdekNumber = await waitForCdekNumber(cdekService, orderUuid);

    setTrackNumber(cdekNumber);
    setPochtaOrderNumber(orderUuid);

    await ctx.replyWithHTML(
      successOrderCdek({ trackNumber: cdekNumber }),
      createInlineKeyboard([
        {
          label: "Отслеживание",
          action: `${TRACKING_CDEK_TRACKING_URL}?order_id=${cdekNumber}`,
          type: "url",
        },
      ] as any),
    );
    // записываем в гугл док
    await saveInfoForCdek(ctx, orderUuid);
  } catch (e) {
    // отправлять кому ошибку?
    console.error("Ошибка формирования заказа СДЭК:", e);
  }
};
