import { GoogleBaseService } from "./GoogleBaseService";
import { ReportType } from "./GoogleType";
import dayjs from "dayjs";
import { MonthEnum } from "./MonthEnum";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { StatusOrderEnum } from "./GoogleTypes";
import { configGoogleTables } from "./configGoogleTables";

dayjs.extend(customParseFormat);

const COUNT_DAY = 20;

class GoogleReportService extends GoogleBaseService {
  private readonly REPORT_SPREADSHEET_ID =
    configGoogleTables.main.spreadsheetId;

  async addReport(data: ReportType) {
    const values = [
      [
        data.userId,
        data.phone,
        data.index,
        data.userName,
        data.typePhoto,
        data.countPhoto,
        data.price,
        data.orderId,
        data.date,
        data.referrerLink,
      ],
    ];

    return await this.saveData(this.REPORT_SPREADSHEET_ID, "A:J", values);
  }

  async checkDateOrder(userId: string): Promise<{ status: StatusOrderEnum }> {
    const currentDate = dayjs();
    const currentMonth = currentDate.format("M");

    const nameBeforeMonth = MonthEnum[Number(currentMonth) - 1];

    const dataCurrentMonth = await this.readAllRange(
      this.REPORT_SPREADSHEET_ID,
      "A:I",
    );

    const dataBeforeMonth = await this.readAllRange(
      this.REPORT_SPREADSHEET_ID,
      `${nameBeforeMonth}!A:I`,
    );

    const allData = [...dataCurrentMonth, ...dataBeforeMonth];
    for (let i = 0; i < allData.length; i++) {
      const row = allData[i];
      // row[0] - это колонка A
      if (row[0] && row[0].toString().trim() === userId) {
        // колонка с датой
        if (row[8]) {
          const targetDate = dayjs(row[8], "DD.MM.YYYY HH:mm:ss");

          if (targetDate.isValid()) {
            const diffDay = currentDate.diff(targetDate, "day");

            if (diffDay >= COUNT_DAY) {
              return { status: StatusOrderEnum.alreadyRead };
            } else {
              return { status: StatusOrderEnum.inProgress };
            }
          } else {
            return { status: StatusOrderEnum.notFound };
          }
        }

        return { status: StatusOrderEnum.notFound };
      }
    }

    return { status: StatusOrderEnum.notFound };
  }

  async getAllRegularUserId(): Promise<Array<string>> {
    const listUserId = await this.readAllUserId(this.REPORT_SPREADSHEET_ID);

    return [
      ...new Set(
        listUserId?.filter((str, index) => listUserId.indexOf(str) !== index),
      ),
    ];
  }

  async getAllUserId(): Promise<Array<string>> {
    const listUserId = await this.readAllUserId(this.REPORT_SPREADSHEET_ID);

    return [...new Set(listUserId)];
  }
}

export const googleReportService = new GoogleReportService();
