import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { GoogleBaseService } from "./GoogleBaseService";
import { configGoogleTables } from "./configGoogleTables";

dayjs.extend(customParseFormat);

const DATE_FORMATS = ["DD.MM.YYYY HH:mm:ss", "DD.MM.YYYY"];
const CELL_PHOTO_COUNT = 0; // колонка F
const CELL_DATE = 3; // колонка I

class GoogleFindNumberOfPhotosService extends GoogleBaseService {
  private readonly REPORT_SPREADSHEET_ID =
    configGoogleTables.main.spreadsheetId;

  /**
   * Считает сумму «Количество фото» за указанную дату.
   * @param date дата в формате DD.MM.YYYY, например 23.09.2025
   */
  async getPhotosCountByDate(date: string): Promise<number> {
    const dataCurrentMonth = await this.readAllRange(
      this.REPORT_SPREADSHEET_ID,
      "F:I",
    );

    const totalPhotos = dataCurrentMonth.reduce((sum, row) => {
      const rowDate = row[CELL_DATE];
      const photoCount = row[CELL_PHOTO_COUNT];

      // пропускаем шапку и итоговую строку без даты
      if (!rowDate || !photoCount) {
        return sum;
      }

      const parsedDate = dayjs(String(rowDate).trim(), DATE_FORMATS, true);
      if (!parsedDate.isValid()) {
        return sum;
      }

      if (parsedDate.format("DD.MM.YYYY") !== date) {
        return sum;
      }

      const count = Number(photoCount);
      return Number.isFinite(count) ? sum + count : sum;
    }, 0);

    return totalPhotos;
  }
}

export const googleFindNumberOfPhotosService =
  new GoogleFindNumberOfPhotosService();
