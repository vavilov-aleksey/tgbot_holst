import { yaDiskService } from "../../../services/YandexDisk";
import { saveFileJpeg } from "../../../services/YandexDisk/saveFileJpeg";
import { getNameFolderYandexDisk } from "../../../features/getNameFolderYandexDisk";
import { DeliveryTypeEnum, TBotContext } from "../../../app/types";
import { CdekService } from "../../../services/Cdek/CdekService";

const PRINT_STATUS_RETRY_MS = 2500;
const PRINT_STATUS_RETRY_COUNT = 12;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForPrintUrl = async (service: CdekService, printUuid: string) => {
  for (let attempt = 1; attempt <= PRINT_STATUS_RETRY_COUNT; attempt++) {
    const printInfo = await service.getPrint(printUuid);
    const printUrl = printInfo?.entity?.url;

    if (printUrl) {
      return printUrl;
    }

    await sleep(PRINT_STATUS_RETRY_MS);
  }

  throw new Error("Не удалось сформировать накладную СДЭК.");
};

export const createPrintCdek = async (ctx: TBotContext, orderUuid: string) => {
  const cdekService = new CdekService();

  const createPrintInfo = await cdekService.createPrint(orderUuid);
  const printUuid = createPrintInfo?.entity?.uuid;

  if (!printUuid) {
    throw new Error("СДЭК не вернул UUID накладной.");
  }

  const printUrl = await waitForPrintUrl(cdekService, printUuid);
  const printFile = await cdekService.downloadPrint(printUrl);

  const { nameFolderCurrentUser } = getNameFolderYandexDisk(ctx);

  const { getUrlForUpload } = yaDiskService();

  const urlForUpload = await getUrlForUpload(
    `${nameFolderCurrentUser}/000trackNumber.jpeg`,
  );

  await saveFileJpeg(urlForUpload, printFile, {
    scale: 1,
    converterType: DeliveryTypeEnum.cdek,
  });
};
