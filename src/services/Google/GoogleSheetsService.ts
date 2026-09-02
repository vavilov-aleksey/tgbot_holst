import { google } from "googleapis";
import path from "path";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
];

const CREDENTIALS_PATH = path.join(process.cwd(), "services-account.json");

export class GoogleSheetsService {
  private auth: any;
  private sheets: any;

  constructor() {
    this.auth = null;
    this.sheets = null;
  }

  async authenticate() {
    if (!this.auth) {
      try {
        this.auth = new google.auth.GoogleAuth({
          keyFile: CREDENTIALS_PATH,
          scopes: SCOPES,
        });
        this.sheets = google.sheets({ version: "v4", auth: this.auth });
      } catch (error) {
        console.log(error);
      }
    }
    return this.auth;
  }

  /**
   * Чтение данных с определенного диапазона
   */
  async readRange(spreadsheetId: string, range: string) {
    await this.authenticate();

    const request = {
      spreadsheetId,
      range: range,
    };

    try {
      const response = await this.sheets.spreadsheets.values.get(request);
      return response.data.values || [];
    } catch (error) {
      console.error(`Ошибка при чтении диапазона ${range}:`, error);
      throw error;
    }
  }

  private async findInColumn(spreadsheetId: string, column: string) {
    await this.authenticate();

    try {
      // Читаем всю колонку
      return await this.readRange(spreadsheetId, `${column}:${column}`);
    } catch (error) {
      console.error("Ошибка при поиске в колонке:", error);
      return [];
    }
  }

  /**
   * Создает новую таблицу
   */
  // async createSpreadsheet(title: string) {
  //   await this.authenticate();
  //
  //   const request = {
  //     resource: {
  //       properties: {
  //         title: title,
  //       },
  //     },
  //   };
  //
  //   try {
  //     const response = await this.sheets.spreadsheets.create(request);
  //     console.log("Таблица создана:", response.data.spreadsheetId);
  //     return response.data;
  //   } catch (error) {
  //     console.error("Ошибка при создании таблицы:", error);
  //     throw error;
  //   }
  // }
}

export const googleSheetsService = new GoogleSheetsService();
