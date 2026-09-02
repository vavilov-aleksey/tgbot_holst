import axios from "axios";
import { GetEnvKey } from "../../features/getEnvKey";
import { createFolder } from "./createFolder";
import { getUrlForUpload } from "./getUrlForUpload";
import { saveFileTxt } from "./saveFileTxt";
import { getPublicResourceFiles } from "./getCountPhotoFromResource";
import { saveAllPhotos } from "./savePhotos";
import { checkCreatePath } from "./checkCreatePath";
import { saveFileJpeg } from "./saveFileJpeg";
import { readTxtFile } from "./readTxtFile";
import * as rax from "retry-axios";

const client = axios.create({
  baseURL: "https://cloud-api.yandex.net",
  headers: { Authorization: new GetEnvKey().get("YANDEX_TOKEN") },
});

rax.attach(client);

client.defaults.raxConfig = {
  retry: 20,
  retryDelay: 1000,
  backoffType: "exponential",
  httpMethodsToRetry: ["GET", "HEAD", "OPTIONS", "DELETE", "PUT", "POST"],
  statusCodesToRetry: [
    [410, 429],
    [423, 423],
    [500, 599],
  ],
  // @ts-ignore
  onRetryAttempt: (err) => {
    const cfg = rax.getConfig(err);
    console.log(
      `🔄 [Retry] ${err.response?.status} → попытка ${cfg?.currentRetryAttempt} для ${err.config?.url}`,
    );
  },
};

export const services = client;

export const yaDiskService = () => {
  return {
    createFolder,
    getUrlForUpload,
    saveFileTxt: saveFileTxt,
    saveFilePdf: saveFileJpeg,
    getPublicResourceFiles,
    saveAllPhotos,
    checkCreatePath,
    readTxtFile,
  };
};
