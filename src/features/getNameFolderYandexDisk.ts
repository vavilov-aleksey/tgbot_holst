import {
  getCurrentDate,
  getDateFromProps,
  reformatPhoneNumber,
} from "../utils";
import { GetEnvKey } from "./getEnvKey";
import { useSessionInfo } from "../hooks";
import { TBotContext, TContextPrintType } from "../app/types";
import { getPrintTypeNameForYandexDisk } from "./getPrintTypeName";

export const getNameFolderYandexDisk = (ctx: TBotContext) => {
  const nameFolderYandexDisk = new GetEnvKey().get("YANDEX_FOLDER_NAME");
  const { date, nameMonth } = getCurrentDate();

  const { getDeliveryInfo, getPhotoInfo } = useSessionInfo(ctx);

  const typePhoto = getPhotoInfo()?.type!;

  const { phone } = getDeliveryInfo();

  const namePrintType =
    getPrintTypeNameForYandexDisk[typePhoto as TContextPrintType];

  const nameFolderWithMonth = `${nameFolderYandexDisk}/${nameMonth}`;

  const nameFolderCurrentDate = `/${nameFolderWithMonth}/${date}`;
  const nameFolderCurrentUser = `${nameFolderCurrentDate}/${reformatPhoneNumber(phone as string)} ${namePrintType} (Оплачен TG_BOT)`;

  const getNameFolderForPhoneNumber = (phoneNumber: string) =>
    `${nameFolderCurrentDate}/${reformatPhoneNumber(phoneNumber)} ${namePrintType} (Оплачен TG_BOT)`;

  const getNameFolderByDate = (dateStr: string) => {
    const { nameMonth: nm, date: d } = getDateFromProps(dateStr);
    return `${nameFolderYandexDisk}/${nm}/${d}`;
  };

  return {
    nameFolder: nameFolderYandexDisk,
    nameFolderMonth: nameFolderWithMonth,
    nameFolderCurrentDate,
    nameFolderCurrentUser,
    getNameFolderForPhoneNumber,
    getNameFolderByDate,
  };
};
