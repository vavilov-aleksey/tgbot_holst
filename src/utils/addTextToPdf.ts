import { PDFDocument, rgb } from "pdf-lib";
import { promises as fs } from "fs";

// Функция для добавления текста в PDF
export const addTextToPdf = async (
  pdfBuffer: Buffer,
  text: string,
  additionalText?: string,
): Promise<Buffer> => {
  try {
    // Загружаем PDF документ
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    // Добавляем текст на первую страницу
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Читаем изображение
    const imageBytes = await fs.readFile("./assets/logo.png");
    const image = await pdfDoc.embedPng(imageBytes);

    firstPage.drawImage(image, {
      x: 15,
      y: 15,
      width: 100,
      height: 61,
    });

    // Добавляем надпись (в верхний левый угол)
    firstPage.drawText(text, {
      x: width - 120, // Отступ справа
      y: 40, // Отступ снизу
      size: 16, // Размер шрифта
      color: rgb(0, 0, 0), // Черный цвет
      opacity: 0.9, // Прозрачность
    });

    firstPage.drawText("TG", {
      x: 15, // Отступ справа
      y: height - 30, // Отступ снизу
      size: 21, // Размер шрифта
      color: rgb(0, 1, 1), // Синий цвет
      opacity: 1, // Прозрачность
    });

    if (additionalText) {
      firstPage.drawText(additionalText, {
        x: 15, // Отступ справа
        y: height - 40, // Отступ снизу
        size: 6, // Размер шрифта
        color: rgb(0, 0, 0),
        opacity: 1,
      });
    }

    // Сохраняем измененный PDF
    const modifiedPdf = await pdfDoc.save();
    return Buffer.from(modifiedPdf);
  } catch (error) {
    console.error("Ошибка при добавлении текста в PDF:", error);
    throw error;
  }
};

export const addLogoToPdf = async (pdfBuffer: Buffer): Promise<Buffer> => {
  try {
    // Загружаем PDF документ
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    // Добавляем текст на первую страницу
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Читаем изображение
    const imageBytes = await fs.readFile("./assets/logo.png");
    const image = await pdfDoc.embedPng(imageBytes);

    firstPage.drawImage(image, {
      x: width - 105,
      y: 160,
      width: 90,
      height: 55,
    });

    // Сохраняем измененный PDF
    const modifiedPdf = await pdfDoc.save();
    return Buffer.from(modifiedPdf);
  } catch (error) {
    console.error("Ошибка при добавлении текста в PDF:", error);
    throw error;
  }
};
