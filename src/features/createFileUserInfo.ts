import { useSessionInfo } from "../hooks";
import { DeliveryTypeEnum, TBotContext, TContextPrintType } from "../app/types";
import { getPrintTypeName } from "./getPrintTypeName";

const nameDelivery = {
  [DeliveryTypeEnum.cdek]: "CDEK",
  [DeliveryTypeEnum.pochta]: "Почта России",
  [DeliveryTypeEnum.post5]: "5POST",
};

export const createFileUserInfo = (ctx: TBotContext) => {
  const {
    getDeliveryInfo,
    getPaymentInfo,
    getTrackNumber,
    getPhotoInfo,
    getOrderInfo,
  } = useSessionInfo(ctx);

  const { userName, phone, index, type, idPvz } = getDeliveryInfo();
  const orderId = getPaymentInfo()?.orderId;
  const paymentDate = getPaymentInfo()?.paymentDate;
  const sum = getPaymentInfo()?.sum;

  const photosCount = getPhotoInfo()?.count;
  const printType = getPhotoInfo()?.type!;
  const trackNumber = getTrackNumber();

  let file =
    `userId: ${ctx?.from?.id}\n` +
    `ФИО: ${userName}\n` +
    `${index ? "Индекс" : "ID ПВЗ"}: ${index || idPvz}\n` +
    `Телефон: ${phone}\n` +
    `Количество фото: ${photosCount}\n` +
    `Тип фото: ${getPrintTypeName[printType as TContextPrintType]} за ${printType} руб.\n\n` +
    `Оплаченная сумма: ${sum} руб.\n` +
    `TrackNumber ${nameDelivery[type!]}: ${trackNumber}\n` +
    `Id оплаты: ${orderId}\n` +
    `Время оплаты: ${paymentDate}\n\n`;

  const linkYandexDisk = getPhotoInfo()?.pathDisk;
  if (linkYandexDisk) {
    file += `Ссылка на яндекс диск: ${linkYandexDisk}\n`;
  }

  const certificateNumber = getOrderInfo()?.certificate?.number;
  if (certificateNumber) {
    file += `Использован сертификат: ${certificateNumber} с типом ${getOrderInfo()?.certificate?.type}\n`;
  }

  return file;
};
