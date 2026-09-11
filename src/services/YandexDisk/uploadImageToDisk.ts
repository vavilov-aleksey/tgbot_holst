import axios, { AxiosError } from "axios";
import fs from "fs";
import { pipeline } from "stream/promises";
import path from "path";
import rax from "retry-axios";
import { services } from "./yaDiskService";
import { ensureJpeg } from "../../utils/ensureJpeg";

const TEMP_DIR = "/tmp";
const UPLOAD_CONCURRENCY = 3;

const DOWNLOAD_MAX_RETRIES = 5;
const DOWNLOAD_CONNECT_TIMEOUT = 30000;
const DOWNLOAD_IDLE_TIMEOUT = 30000;

const axiosInstance = axios.create();

axiosInstance.defaults.raxConfig = {
  instance: axiosInstance,
  retry: 3,
  noResponseRetries: 3,
  retryDelay: 1000,
  backoffType: "exponential",
  httpMethodsToRetry: ["GET", "HEAD", "OPTIONS", "DELETE", "PUT", "POST"],
  statusCodesToRetry: [
    [100, 199],
    [429, 429],
    [500, 599],
  ],
  //@ts-ignore
  onRetryAttempt: (err: AxiosError) => {
    const cfg = rax.getConfig(err);
    console.log(`Попытка ${cfg?.currentRetryAttempt} для ${err?.config?.url}`);
  },
  shouldRetry: (err) => {
    const isNetworkError = !err.response;
    const isRetryableError =
      err.code === "ECONNRESET" ||
      err.code === "ETIMEDOUT" ||
      err.code === "ECONNABORTED" ||
      err.code === "ENOTFOUND";

    return isNetworkError || isRetryableError;
  },
};

axiosInstance.interceptors.request.use((config) => {
  if (!config.raxConfig) {
    config.raxConfig = axiosInstance.defaults.raxConfig;
  }
  return config;
});

rax?.attach(axiosInstance);

const isRetryableDownloadError = (error: unknown) => {
  const err = error as AxiosError | undefined;

  if (!err) {
    return false;
  }

  if (!err.response) {
    return true;
  }

  const status = err.response.status;
  return status === 429 || status >= 500;
};

const downloadOnce = async (
  fileHref: string,
  localFilePath: string,
): Promise<void> => {
  const controller = new AbortController();
  let idleTimer: NodeJS.Timeout | null = null;

  const clearIdle = () => {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  };

  const resetIdle = () => {
    clearIdle();
    idleTimer = setTimeout(() => controller.abort(), DOWNLOAD_IDLE_TIMEOUT);
  };

  // Отдельные повторы делаем вручную, rax здесь отключаем.
  const response = await axiosInstance.get(fileHref, {
    responseType: "stream",
    timeout: DOWNLOAD_CONNECT_TIMEOUT,
    signal: controller.signal,
    raxConfig: { retry: 0 },
  });

  resetIdle();
  response.data.on("data", resetIdle);

  try {
    await pipeline(response.data, fs.createWriteStream(localFilePath));
  } finally {
    clearIdle();
  }
};

const downloadFileToTemp = async (
  fileHref: string,
  tempFileName: string,
): Promise<string> => {
  const localFilePath = path.join(TEMP_DIR, tempFileName);

  for (let attempt = 0; attempt < DOWNLOAD_MAX_RETRIES; attempt++) {
    try {
      await downloadOnce(fileHref, localFilePath);
      return localFilePath;
    } catch (error) {
      await fs.promises.unlink(localFilePath).catch(() => {});

      const isLastAttempt = attempt === DOWNLOAD_MAX_RETRIES - 1;

      if (isLastAttempt || !isRetryableDownloadError(error)) {
        throw error;
      }

      console.log(
        `Повтор скачивания ${attempt + 1}/${DOWNLOAD_MAX_RETRIES - 1} для ${tempFileName}`,
      );

      const delay = Math.min(2 ** attempt * 1000, 15000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Не удалось скачать файл: ${tempFileName}`);
};

const uploadWithRetry = async (
  urlForUpload: (value: string) => Promise<string | null>,
  diskPath: string,
  localFilePath: string,
  maxRetries = 20,
): Promise<boolean> => {
  const diskFileName = path.basename(diskPath);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const uploadUrl = await urlForUpload(diskPath);

    if (!uploadUrl) {
      return false;
    }

    const fileStream = fs.createReadStream(localFilePath);

    try {
      const result = await services.put(uploadUrl, fileStream, {
        headers: { "Content-Type": "image/jpeg" },
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const folderPath = path.dirname(diskPath);
      const { data: dataCheckNames } = await services.get(
        `v1/disk/resources?path=${encodeURIComponent(folderPath)}&limit=10000&fields=_embedded.items.name`,
      );

      const listNames = dataCheckNames._embedded.items.map(
        (item: { name: string }) => item.name,
      );

      if (listNames.includes(diskFileName)) {
        return true;
      }

      // console.log({
      //   config: {
      //     baseURL: result.config.baseURL,
      //     method: result.config.method,
      //     url: result.config.url,
      //     date: result.headers.date,
      //   },
      //   diskPath,
      //   status: result?.status,
      //   statusText: result?.statusText,
      //   aborted: result?.request?.aborted,
      // });

      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      fileStream.destroy();
      console.error(`Upload attempt ${attempt + 1} failed:`, error);
      if (attempt === maxRetries - 1) {
        throw error;
      }
    }
  }

  return false;
};

export const uploadImageFromUrl = async ({
  fileHref,
  originalFileName,
  targetFolder,
  getUrlForUpload,
  mimeType,
}: {
  fileHref: string;
  originalFileName: string;
  targetFolder: string;
  getUrlForUpload: (value: string) => Promise<string | null>;
  mimeType?: string;
}): Promise<boolean> => {
  const tempFileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${path.extname(originalFileName)}`;
  let localFilePath = "";
  let convertedFilePath = "";

  try {
    localFilePath = await downloadFileToTemp(fileHref, tempFileName);

    const { filePath, fileName } = await ensureJpeg(
      localFilePath,
      originalFileName,
      mimeType,
    );

    convertedFilePath = filePath;
    const diskPath = `${targetFolder}/${fileName}`;

    return await uploadWithRetry(getUrlForUpload, diskPath, convertedFilePath);
  } finally {
    await Promise.all([
      localFilePath
        ? fs.promises.unlink(localFilePath).catch(() => {})
        : Promise.resolve(),
      convertedFilePath && convertedFilePath !== localFilePath
        ? fs.promises.unlink(convertedFilePath).catch(() => {})
        : Promise.resolve(),
    ]);
  }
};

export const uploadPublicImageToDisk = async ({
  publicKey,
  file,
  targetFolder,
  getUrlForUpload,
  getDownloadHref,
}: {
  publicKey: string;
  file: { name: string; path: string; mime_type?: string };
  targetFolder: string;
  getUrlForUpload: (value: string) => Promise<string | null>;
  getDownloadHref: (
    publicKey: string,
    filePath?: string,
  ) => Promise<string | null>;
}): Promise<boolean> => {
  const downloadHref = await getDownloadHref(publicKey, file.path);

  if (!downloadHref) {
    console.error(`Не удалось получить ссылку на скачивание: ${file.name}`);
    return false;
  }

  return uploadImageFromUrl({
    fileHref: downloadHref,
    originalFileName: file.name,
    targetFolder,
    getUrlForUpload,
    mimeType: file.mime_type,
  });
};

export const uploadPublicImagesToDisk = async ({
  publicKey,
  files,
  targetFolder,
  getUrlForUpload,
  getDownloadHref,
}: {
  publicKey: string;
  files: Array<{ name: string; path: string; mime_type?: string }>;
  targetFolder: string;
  getUrlForUpload: (value: string) => Promise<string | null>;
  getDownloadHref: (
    publicKey: string,
    filePath?: string,
  ) => Promise<string | null>;
}): Promise<void> => {
  const queue = [...files];

  const workers = Array.from(
    { length: Math.min(UPLOAD_CONCURRENCY, queue.length) },
    async () => {
      while (queue.length) {
        const file = queue.shift();

        if (!file) {
          return;
        }

        try {
          await uploadPublicImageToDisk({
            publicKey,
            file,
            targetFolder,
            getUrlForUpload,
            getDownloadHref,
          });
        } catch (e) {
          console.error(`Ошибка загрузки файла ${file.name}:`, e);
        }
      }
    },
  );

  await Promise.all(workers);
};
