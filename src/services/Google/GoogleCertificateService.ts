import { GoogleBaseService } from "./GoogleBaseService";
import { ReportCertificateType } from "./GoogleType";
import { getCurrentDateMoscow } from "../../utils/getCurrentDate";
import { CertificateEnum } from "../../app/types/certificateType";
import { configGoogleTables } from "./configGoogleTables";

const CELL_QUANTITY = 2;
const CELL_TYPE = 3;
const CELL_CERTIFICATE = 7;
const CELL_USE_DATE = 9;

class GoogleCertificateService extends GoogleBaseService {
  private readonly MAIN_SPREADSHEET_ID = configGoogleTables.main.spreadsheetId;

  private readonly TABLE_NAME = configGoogleTables.main.sheets.certificates;

  async addCertificate(data: ReportCertificateType) {
    const values = [
      [
        data.userId,
        data.phone,
        data.countPhoto,
        data.type,
        data.price,
        data.orderId,
        data.date,
        data.certificateNumber,
        data.referrerLink,
      ],
    ];

    return await this.saveData(
      this.MAIN_SPREADSHEET_ID,
      `${this.TABLE_NAME}!A:K`,
      values,
    );
  }

  async checkCertificate(numberCertificate: string) {
    const allData = await this.readAllRange(
      this.MAIN_SPREADSHEET_ID,
      `${this.TABLE_NAME}!A:J`,
    );

    for (let i = 0; i < allData.length; i++) {
      const row = allData[i];
      if (
        row[CELL_CERTIFICATE] &&
        row[CELL_CERTIFICATE].toString().toUpperCase().trim() ===
          numberCertificate.toUpperCase().trim()
      ) {
        // console.log({
        //   rowNumber: i + 1, // +1 потому что в Google Sheets строки начинаются с 1
        //   quantity: row[CELL_QUANTITY], // колонка C - количество
        //   certificateNumber: row[CELL_CERTIFICATE],
        //   usageDate: row[CELL_USE_DATE] || null, // колонка H - дата использования
        // });

        return {
          alreadyUsed: !!row[CELL_USE_DATE], // если сертификат уже использован
          rowNumber: i + 1, // +1 потому что в Google Sheets строки начинаются с 1
          quantity: row[CELL_QUANTITY], // колонка C - количество
          certificateNumber: row[CELL_CERTIFICATE],
          usageDate: row[CELL_USE_DATE] || null, // колонка H - дата использования
          type: row[CELL_TYPE] as CertificateEnum,
        };
      }
    }

    return null;
  }

  async setCertificateDateUsage(rowNumber: number) {
    await this.updateData(
      this.MAIN_SPREADSHEET_ID,
      `${this.TABLE_NAME}!J${rowNumber}`,
      getCurrentDateMoscow(),
    );
  }
}

export const googleCertificateService = new GoogleCertificateService();
