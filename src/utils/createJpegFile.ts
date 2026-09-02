import fs from "fs";
import { fromPath } from "pdf2pic";
import { v4 as uuidv4 } from "uuid";
import { resizeAndPositionPdf } from "./resizeAndPositionPdf";
import { addLogoToPdf, addTextToPdf } from "./addTextToPdf";
import { DeliveryTypeEnum } from "../app/types";

export const createJpegFile = async (
  pdfData: string,
  options: {
    scale: number;
    converterType: DeliveryTypeEnum;
    text?: string;
    additionalText?: string;
  },
) => {
  const id = uuidv4().substring(0, 8);
  const filePath = `./${id}_temp_file.pdf`;
  const saveFilename = `${id}_temp_image`;
  let pdfBuffer = Buffer.from(pdfData, "binary");

  const { scale, converterType, text, additionalText } = options;

  try {
    pdfBuffer = await resizeAndPositionPdf(pdfBuffer, scale, converterType);

    if (converterType === DeliveryTypeEnum.cdek) {
      pdfBuffer = await addLogoToPdf(pdfBuffer);
    }

    if (text) {
      pdfBuffer = await addTextToPdf(pdfBuffer, text, additionalText);
    }
  } catch (e) {
    console.log("Error addTextToPdf", e);
  }

  // Сохраняем PDF во временный файл
  await fs.promises.writeFile(filePath, pdfBuffer);

  // Конвертируем в JPEG (первую страницу)
  const converter = fromPath(filePath, {
    format: "jpeg",
    saveFilename,
    savePath: "./",
    density: 1200,
  });

  const { path: jpegPath } = await converter(1); // Конвертируем страницу 1

  // Создаем ReadStream для JPEG
  const fileStream = fs.createReadStream(jpegPath as string);

  // Функция для удаления временных файлов (PDF + JPEG)
  const onDeleteFileStream = async () => {
    await Promise.all([
      fs.promises.unlink(filePath), // Удаляем PDF
      fs.promises.unlink(jpegPath as string), // Удаляем JPEG
    ]).catch((e) => console.error("Ошибка в удалении createJpegFile: ", e));
  };

  return { fileStream, onDeleteFileStream };
};
