import { PDFDocument, rgb } from "pdf-lib";

// Функция для добавления текста в PDF для сертификатов
export const addTextToPdfCertificate = async (
  pdfBuffer: Buffer,
  text: string,
): Promise<Buffer> => {
  try {
    // Загружаем PDF документ
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    // Добавляем текст на первую страницу
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Добавляем надпись по центру фото
    firstPage.drawText(text, {
      x: width / 2 - 65, // Отступ справа
      y: height / 2 - 20, // Отступ снизу
      size: 26, // Размер шрифта
      color: rgb(0, 0, 0), // Черный цвет
      opacity: 1, // Прозрачность
    });

    // Сохраняем измененный PDF
    const modifiedPdf = await pdfDoc.save();
    return Buffer.from(modifiedPdf);
  } catch (error) {
    console.error("Ошибка при добавлении текста в PDF:", error);
    throw error;
  }
};
