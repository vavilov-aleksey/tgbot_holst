// GoogleBaseService.ts
import { google } from "googleapis";
import path from "path";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
];

const CREDENTIALS_PATH = path.join(process.cwd(), "services-account.json");

export abstract class GoogleBaseService {
  protected auth: any = null;
  protected sheets: ReturnType<typeof google.sheets> | null = null;

  protected async authenticate(): Promise<void> {
    if (!this.auth) {
      try {
        this.auth = new google.auth.GoogleAuth({
          keyFile: CREDENTIALS_PATH,
          scopes: SCOPES,
        });
        this.sheets = google.sheets({ version: "v4", auth: this.auth });
      } catch (error) {
        console.error("Ошибка авторизации Google:", error);
        throw error;
      }
    }
  }

  protected async readAllRange(
    spreadsheetId: string,
    range: string,
  ): Promise<any[][]> {
    await this.authenticate();

    try {
      const response = await this.sheets!.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      return response.data.values || [];
    } catch (error) {
      console.error(`Ошибка при чтении диапазона ${range}:`, error);
      throw error;
    }
  }

  protected async readAllUserId(spreadsheetId: string) {
    await this.authenticate();

    try {
      const spreadsheet = await this.sheets!.spreadsheets.get({
        spreadsheetId: spreadsheetId,
        fields: "sheets.properties.title",
      });

      const sheets = spreadsheet.data.sheets || [];
      let allData: Array<string> = [];

      // Проходим по всем листам и собираем данные
      for (const sheet of sheets) {
        const sheetName = sheet.properties?.title;
        if (!sheetName) continue;

        try {
          // Читаем данные с каждого листа 1ой колонки с id
          const range = `${sheetName}!A:A`;
          const data = await this.readAllRange(spreadsheetId, range);

          if (data?.length > 0) {
            const clearId = data?.flatMap((i) => i)?.filter((i) => Number(i));
            allData = [...allData, ...clearId];
          }
        } catch (error) {
          console.log(`Ошибка при чтении листа ${sheetName}:`, error);
          // Продолжаем со следующим листом
          continue;
        }
      }

      return allData;
    } catch (error) {
      console.error(`Ошибка при получении всех userId:`, error);
      throw error;
    }
  }

  protected async saveData(
    spreadsheetId: string,
    range: string,
    values: any[][],
  ): Promise<any> {
    await this.authenticate();

    try {
      const response = await this.sheets!.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values },
      });
      return response.data;
    } catch (error) {
      console.error("Ошибка при записи данных:", error);
      throw error;
    }
  }

  /**
   * Обновление даты использования для сертификата
   */
  protected async updateData(
    spreadsheetId: string,
    range: string, // вид "КолонкаНомерСтроки"
    value: string,
  ) {
    await this.authenticate();

    const request = {
      spreadsheetId,
      range: range,
      valueInputOption: "RAW",
      resource: {
        values: [[value]],
      },
    };

    try {
      const response = await this.sheets!.spreadsheets.values.update(request);
      return response.data;
    } catch (error) {
      console.error("Ошибка при обновлении данных:", error);
      throw error;
    }
  }
}
