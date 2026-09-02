import { yaDiskService } from "../services/YandexDisk";
import { createFileUserInfo } from "./createFileUserInfo";
import { getNameFolderYandexDisk } from "./getNameFolderYandexDisk";
import { TBotContext } from "../app/types";
import { saveInDownloads } from "../services/YandexDisk/saveInDownloads";
import { createPrintDelivery } from "../bot/commands/delivery/createPrintDelivery";

export const createFolderForUserInfo = async (
  ctx: TBotContext,
  allStep = true,
) => {
  const { createFolder, getUrlForUpload, saveFileTxt, saveAllPhotos } =
    yaDiskService();
  const {
    nameFolder,
    nameFolderMonth,
    nameFolderCurrentUser,
    nameFolderCurrentDate,
  } = getNameFolderYandexDisk(ctx);

  // создаем папку на диске если её нет
  await createFolder(nameFolder);

  // создаем папку с названием месяца
  await createFolder(nameFolderMonth);

  // создаем папку с датой
  await createFolder(nameFolderCurrentDate);

  // создаем папку для конкретного юзера
  await createFolder(nameFolderCurrentUser);

  if (allStep) {
    // получаем ссылку для загрузки txt файла
    const urlForUploadTxt = await getUrlForUpload(
      `${nameFolderCurrentUser}/яяяuserInfo.txt`,
    );

    // создаем накладные для печати
    await createPrintDelivery(ctx);

    const userInfoFile = createFileUserInfo(ctx);

    await saveFileTxt(urlForUploadTxt, userInfoFile);
  }

  await saveAllPhotos(ctx, nameFolderCurrentUser);

  // Загрузка с публичной папки Я.Диска — в фоне, чтобы не блокировать бота
  await saveInDownloads(ctx, nameFolderCurrentUser).catch((e) => {
    console.error("Error saveInDownloads (background):", e);
  });
};

export const createFolderOnlyFixPhoto = async (
  ctx: TBotContext,
  nameFolder: string,
) => {
  const { saveAllPhotos } = yaDiskService();

  await saveAllPhotos(ctx, nameFolder);

  await saveInDownloads(ctx, nameFolder).catch((e) => {
    console.error("Error saveInDownloads createFolderOnlyFixPhoto:", e);
  });
};
