import fs from "fs";
import { fromPath } from "pdf2pic";
import { addTextToPdfCertificate } from "./addTextToPdfCertificate";
import { v4 as uuidv4 } from "uuid";

export const createJpegFileForCertificate = async (
  phoneText: string,
  countPhoto: number,
) => {
  const id = uuidv4().substring(0, 8);
  const filePath = `./${id}_temp_file.pdf`;
  const saveFilename = `${id}_temp_image`;

  // Читаем PDF файл
  let pdfBuffer = await fs.promises.readFile(
    `./assets/certificate_${countPhoto}.pdf`,
  );

  try {
    pdfBuffer = await addTextToPdfCertificate(pdfBuffer, phoneText);
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
    preserveAspectRatio: true,
  });

  const { path: jpegPath } = await converter(1); // Конвертируем страницу 1

  const photoBuffer = await fs.promises.readFile(jpegPath as string);

  // Функция для удаления временных файлов (PDF + JPEG)
  const onDeleteFileStream = async () => {
    await Promise.all([
      fs.promises.unlink(filePath), // Удаляем PDF
      fs.promises.unlink(jpegPath as string), // Удаляем JPEG
    ]).catch((e) => console.error("Ошибка в удалении createJpegFile: ", e));
  };

  return { photoBuffer, onDeleteFileStream };
};
