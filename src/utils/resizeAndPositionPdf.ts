import { PageSizes, PDFDocument } from "pdf-lib";
import { DeliveryTypeEnum } from "../app/types";

export const resizeAndPositionPdf = async (
  pdfBuffer: Buffer,
  scale: number = 0.7,
  converterType: DeliveryTypeEnum,
): Promise<Buffer> => {
  const newPdfDoc = await PDFDocument.create();
  const originalPdfDoc = await PDFDocument.load(pdfBuffer);

  const pageCount = originalPdfDoc.getPageCount();

  for (let i = 0; i < pageCount; i++) {
    // Встраиваем страницу
    const [embeddedPage] = await newPdfDoc.embedPdf(originalPdfDoc, [i]);

    if (converterType === DeliveryTypeEnum.cdek) {
      const newPage = newPdfDoc.addPage(PageSizes.A6);
      newPage.drawPage(embeddedPage);
    }

    if (converterType === DeliveryTypeEnum.pochta) {
      const width = embeddedPage.width;
      const height = embeddedPage.height;

      const newWidth = width * scale;
      const newHeight = height * scale;

      const newPage = newPdfDoc.addPage([width, height]);

      newPage.drawPage(embeddedPage, {
        x: width - newWidth - 15,
        y: height - newHeight - 15,
        width: newWidth,
        height: newHeight,
      });
    }
  }

  return Buffer.from(await newPdfDoc.save());
};
