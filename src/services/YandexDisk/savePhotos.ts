import axios, { AxiosError } from "axios";
import fs from "fs";
import { pipeline } from "stream/promises";
import path from "path";
import { services, yaDiskService } from "./yaDiskService";
import { TBotContext } from "../../app/types";
import { useSessionInfo } from "../../hooks";
import rax from "retry-axios";

const TEMP_DIR = "/tmp";
const PHOTO_UPLOAD_CONCURRENCY = 3;

// Создаем экземпляр axios с настройками повторных попыток
const axiosInstance = axios.create({
  timeout: 30000,
});

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
  diskPath: string,
  localFilePath: string,
  maxRetries = 20,
): Promise<boolean> => {
  const fileName = path.basename(diskPath);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    console.log(
      `[YandexDisk] upload attempt ${attempt + 1}/${maxRetries} for ${fileName}`,
    );
    const uploadUrl = await urlForUpload(diskPath);

    if (!uploadUrl) {
      return false;
    }

    const fileStream = fs.createReadStream(localFilePath);

    try {
      // Загрузка файла
      const result = await services.put(uploadUrl, fileStream, {
        headers: { "Content-Type": "image/jpeg" },
      });

      fileStream.destroy();

      // Ждем перед проверкой
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Проверяем наличие файла
      const folderPath = path.dirname(diskPath);
      const { data: dataCheckNames } = await services.get(
        `v1/disk/resources?path=${encodeURIComponent(folderPath)}&limit=10000&fields=_embedded.items.name`,
      );

      const listNames = dataCheckNames._embedded.items.map(
        (item: { name: string }) => item.name,
      );

      if (listNames.includes(fileName)) {
        console.log(
          `[YandexDisk] ✓ uploaded ${fileName} after ${attempt + 1} attempts`,
        );
        return true;
      }
    } catch (error) {
      fileStream.destroy();
      console.error(
        `[YandexDisk] Upload attempt ${attempt + 1} failed for ${fileName}:`,
        error,
      );
      if (attempt === maxRetries - 1) {
        throw error;
      }
    }

    if (attempt < maxRetries - 1) {
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.error(
    `[YandexDisk] ✗ upload failed after ${maxRetries} attempts for ${fileName}`,
  );

  return false;
};

function removePrefix(str: string) {
  return str.replace(/^(photos|documents)\//, "/");
}

const savePhoto = async (
  hrefUpload: string,
  photo: PhotoType,
): Promise<boolean> => {
  if (!hrefUpload || !photo?.href) {
    console.error(
      `[YandexDisk] savePhoto: missing data for photo ${photo?.file_id}`,
    );
    return false;
  }

  const tempFileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
  const localFilePath = path.join(TEMP_DIR, tempFileName);

  try {
    // Скачиваем файл один раз
    console.log(
      `[YandexDisk] downloading photo ${photo?.file_id} for upload to ${hrefUpload}`,
    );
    const response = await axiosInstance.get(photo.href, {
      responseType: "stream",
    });

    await pipeline(response.data, fs.createWriteStream(localFilePath));

    // Формируем путь на диске
    const diskPath = `${hrefUpload}${removePrefix(photo.file_path)}`;

    const { getUrlForUpload } = yaDiskService();

    return await uploadWithRetry(getUrlForUpload, diskPath, localFilePath);
  } catch (e) {
    // @ts-ignore
    console.error(`[YandexDisk] savePhoto failed for ${photo?.file_id}:`, e);
    return false;
  } finally {
    // Удаляем временный файл
    await fs.promises.unlink(localFilePath).catch(() => {});
  }
};

export const saveAllPhotos = async (ctx: TBotContext, pathToFolder: string) => {
  const { getPhotoInfo } = useSessionInfo(ctx);
  const photos = getPhotoInfo()?.listId ?? [];

  try {
    console.log(
      `[YandexDisk] start saveAllPhotos, chatId: ${ctx?.from?.id}, photo count: ${photos?.length ?? 0}`,
    );

    // Батчинг: загружаем по PHOTO_UPLOAD_CONCURRENCY фото за раз
    const batches: Array<Array<string>> = [];
    for (let i = 0; i < photos.length; i += PHOTO_UPLOAD_CONCURRENCY) {
      batches.push(photos.slice(i, i + PHOTO_UPLOAD_CONCURRENCY));
    }

    let succeededTotal = 0;
    let failedTotal = 0;

    for (const batch of batches) {
      const results: Array<boolean> = await Promise.all(
        batch.map(async (photoId: string) => {
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

            console.log(`[YandexDisk] uploading photo ${newPath}`);

            const success = await savePhoto(pathToFolder, {
              ...file,
              file_path: newPath,
              href: fileLink.href,
              pathName: fileLink.pathname,
            } as PhotoType);

            return success;
          } catch (e) {
            console.error(`Не удалось обработать файл ${photoId}:`, e);
            return false;
          }
        }),
      );

      // Log batch results
      const succeeded = results.filter((r) => r).length;
      const failed = results.filter((r) => !r).length;
      if (failed > 0) {
        console.error(
          `[YandexDisk] batch result: ${succeeded} succeeded, ${failed} failed`,
        );
      }
      succeededTotal += succeeded;
      failedTotal += failed;
    }

    console.log(
      `[YandexDisk] finish saveAllPhotos, chatId: ${ctx?.from?.id}, total: ${photos.length}, succeeded: ${succeededTotal}, failed: ${failedTotal}`,
    );
  } catch (e) {
    console.log("Что то пошло не так в сохранении фото на яндекс диск: ", e);
  }
};
