import { GoogleBaseService } from "./GoogleBaseService";
import { CdekInfoType } from "./GoogleType";
import { configGoogleTables } from "./configGoogleTables";

class GoogleCdekInfoService extends GoogleBaseService {
  private readonly CERTIFICATE_SPREADSHEET_ID =
    configGoogleTables.main.spreadsheetId;

  private readonly TABLE_NAME = configGoogleTables.main.sheets.reportsCdek;

  async addInfo(data: CdekInfoType) {
    const values = [
      [
        data.userId,
        data.phone,
        data.countPhoto,
        data.price,
        data.deliveryPayment,
      ],
    ];

    return await this.saveData(
      this.CERTIFICATE_SPREADSHEET_ID,
      `${this.TABLE_NAME}!A:F`,
      values,
    );
  }
}

export const googleCdekInfoService = new GoogleCdekInfoService();
