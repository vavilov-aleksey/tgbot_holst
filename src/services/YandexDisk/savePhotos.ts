import axios, { AxiosError } from "axios";
import fs from "fs";
import { pipeline } from "stream/promises";
import path from "path";
import { services, yaDiskService } from "./yaDiskService";
import { TBotContext } from "../../app/types";
import { useSessionInfo } from "../../hooks";
import rax from "retry-axios";

const TEMP_DIR = "/tmp";

// Создаем экземпляр axios с настройками повторных попыток
const axiosInstance = axios.create();

// Подключаем retry-axios к этому экземпляру
axiosInstance.defaults.raxConfig = {
  instance: axiosInstance,
  retry: 3, // Количество попыток
  noResponseRetries: 3, // Повтор при отсутствии ответа
  retryDelay: 1000, // Задержка между попытками
  backoffType: "exponential", // Экспоненциальная задержка
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
    // Повторяем только для сетевых ошибок и таймаутов
    const isNetworkError = !err.response;
    const isRetryableError =
      err.code === "ECONNRESET" ||
      err.code === "ETIMEDOUT" ||
      err.code === "ECONNABORTED" ||
      err.code === "ENOTFOUND";

    return isNetworkError || isRetryableError;
  },
};

// Применяем interceptor
axiosInstance.interceptors.request.use((config) => {
  config.raxConfig = axiosInstance.defaults.raxConfig;
  return config;
});

rax?.attach(axiosInstance);

const createLocalFilePhoto = async (fileName: string, fileHref: string) => {
  const localFilePath = path.join(TEMP_DIR, fileName);

  const response = await axiosInstance.get(fileHref, {
    responseType: "stream",
    timeout: 60000,
    raxConfig: {
      // Можно переопределить настройки для конкретного запроса
      retry: 5,
      retryDelay: 2000,
    },
  });

  // const response = await axios.get(fileHref, {
  //   responseType: "stream",
  // });
  await pipeline(response.data, fs.createWriteStream(localFilePath));

  const fileStream = fs.createReadStream(localFilePath);

  const removeCopyFile = async () => {
    await fs.promises.unlink(localFilePath);
  };

  return {
    fileStream,
    removeCopyFile,
  };
};

type PhotoType = {
  file_id: string;
  file_unique_id: string;
  file_size: number;
  file_path: string;
  href: string;
  pathName: string;
};

// Вспомогательная функция для повторных попыток
const uploadWithRetry = async (
  urlForUpload: (value: string) => Promise<string>,
  fileName: string,
  fileHref: string,
  hrefUpload: string,
  maxRetries = 20,
): Promise<boolean> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const getUrlForUpload = await urlForUpload(`${hrefUpload}${fileName}`);

    const { fileStream, removeCopyFile } = await createLocalFilePhoto(
      fileName,
      fileHref,
    );

    try {
      // Загрузка файла
      const result = await services.put(getUrlForUpload, fileStream, {
        headers: { "Content-Type": "image/jpeg" },
      });

      // Ждем перед проверкой
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Проверяем наличие файла
      const { data: dataCheckNames } = await services.get(
        `v1/disk/resources?path=${encodeURIComponent(hrefUpload)}&limit=10000&fields=_embedded.items.name`,
      );

      const listNames = dataCheckNames._embedded.items.map(
        (item: { name: string }) => item.name,
      );

      if (listNames.includes(fileName.slice(1))) {
        return true;
      } else {
        console.log({
          config: {
            baseURL: result.config.baseURL,
            method: result.config.method,
            url: result.config.url,
            date: result.headers.date,
          },
          fileName,
          status: result?.status,
          statusText: result?.statusText,
          aborted: result?.request?.aborted,
        });
      }

      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`Upload attempt ${attempt + 1} failed:`);
      if (attempt === maxRetries - 1) throw error;
    } finally {
      await removeCopyFile();
    }
  }

  return false;
};

function removePrefix(str: string) {
  return str.replace(/^(photos|documents)\//, "/");
}

const savePhoto = async (hrefUpload: string, photo: PhotoType) => {
  if (!hrefUpload) return null;

  try {
    const { getUrlForUpload } = yaDiskService();
    const fileName = removePrefix(photo?.file_path);
    const fileHref = photo?.href;

    await uploadWithRetry(getUrlForUpload, fileName, fileHref, hrefUpload);
  } catch (e) {
    // @ts-ignore
    console.error("Загрузить файл не удалось в savePhoto! ", e);
  }
};

export const saveAllPhotos = async (ctx: TBotContext, pathToFolder: string) => {
  const { getPhotoInfo } = useSessionInfo(ctx);
  const photos = getPhotoInfo()?.listId ?? [];

  try {
    // console.log(
    //   "Количество всех фото: ",
    //   getPhotoInfo()?.count,
    //   `chatId: ${ctx?.from?.id}`,
    // );
    await Promise.all(
      photos.map(async (photoId: string) => {
        try {
          const fileLink = await ctx.telegram.getFileLink(photoId);
          const file = await ctx.telegram.getFile(photoId);

          const timestamp = Date.now();
          const uniqueFileName = `file_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;

          // Разбираем путь на компоненты
          const parsedPath = path.parse(file["file_path"] as string);

          // Собираем новый путь с измененным именем
          const newPath = path.format({
            dir: "photos",
            name: uniqueFileName,
            ext: parsedPath.ext,
          });

          await savePhoto(pathToFolder, {
            ...file,
            file_path: newPath,
            href: fileLink.href,
            pathName: fileLink.pathname,
          } as PhotoType);

          // await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (e) {
          console.error(`Не удалось обработать файл ${photoId}:`, e);
        }
      }),
    );
  } catch (e) {
    console.log("Что то пошло не так в сохранении фото на яндекс диск: ", e);
  }
};
