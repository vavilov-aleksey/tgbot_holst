import { createJpegFile } from "../../utils";
import axios, { AxiosError } from "axios";
import rax from "retry-axios";
import { DeliveryTypeEnum } from "../../app/types";

// Настраиваем interceptor для retry-axios
rax?.attach();

export const saveFileJpeg = async (
  urlForUpload: string,
  pdfFile: any,
  options: {
    scale: number;
    converterType: DeliveryTypeEnum;
    text?: string;
    additionalText?: string;
  },
) => {
  const { fileStream, onDeleteFileStream } = await createJpegFile(
    pdfFile,
    options,
  );

  // Счетчик попыток
  let attempt = 0;

  try {
    // Создаем конфигурацию для retry
    const config: any = {
      url: urlForUpload,
      method: "PUT",
      data: fileStream,
      headers: {
        "Content-Type": "application/jpeg",
      },
      raxConfig: {
        // Базовые настройки
        retry: 5, // Максимум 5 попытки (итого 6 запроса с учетом первого)

        // Задержки между попытками (в миллисекундах)
        retryDelay: 1000, // Базовая задержка 1 секунда
        backoffType: "exponential", // Экспоненциальное увеличение задержки

        // Коллбэк для отслеживания попыток
        onRetryAttempt: (err: AxiosError) => {
          attempt++;
          const cfg = rax.getConfig(err);
          console.log(
            `[Retry fileJpeg] Попытка ${cfg?.currentRetryAttempt} для ${urlForUpload}`,
          );
          console.log(
            `[Retry fileJpeg] Статус: ${err.response?.status || "No response"}`,
          );
          console.log(
            `[Retry fileJpeg] Следующая попытка через: ${cfg?.retryDelay}ms`,
          );
        },

        // Проверка, нужно ли повторять запрос
        shouldRetry: (err: AxiosError) => {
          const cfg = rax.getConfig(err);

          // Логируем каждую попытку
          if (cfg?.currentRetryAttempt! > 0) {
            console.log(
              `[Retry fileJpeg ${cfg?.currentRetryAttempt}] Запрос повторен`,
            );
          }

          // По умолчанию retry-axios сам решает, нужно ли повторять
          return rax.shouldRetryRequest(err);
        },
      },
    };

    await axios(config);

    // await axios.put(urlForUpload, fileStream, {
    //   headers: {
    //     "Content-Type": "application/jpeg",
    //   },
    // });
  } catch (e) {
    console.log("Error saveFileJpeg: ", e);
    console.error(
      `[Failed fileJpeg] Запрос не удался после ${attempt + 1} попыток`,
    );
  } finally {
    await onDeleteFileStream();
  }
};
