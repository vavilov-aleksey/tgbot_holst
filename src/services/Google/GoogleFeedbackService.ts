import { GoogleBaseService } from "./GoogleBaseService";
import { FeedbackType } from "./GoogleType";
import { configGoogleTables } from "./configGoogleTables";

class GoogleFeedbackService extends GoogleBaseService {
  private readonly CERTIFICATE_SPREADSHEET_ID =
    configGoogleTables.main.spreadsheetId;

  private readonly FEEDBACK_TABLE_NAME =
    configGoogleTables.main.sheets.feedback;

  async addFeedback(data: FeedbackType) {
    const values = [[data.userId, data.comment, data.referrerLink, data.date]];

    return await this.saveData(
      this.CERTIFICATE_SPREADSHEET_ID,
      `${this.FEEDBACK_TABLE_NAME}!A:D`,
      values,
    );
  }
}

export const googleFeedbackService = new GoogleFeedbackService();
