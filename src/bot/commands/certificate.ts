import { Command } from "./command";
import { Telegraf } from "telegraf";
import { TBotContext } from "../../app/types";
import { CREATE_ORDER_CERTIFICATE_ROUTE } from "../../configs/routes";
import { useSessionInfo } from "../../hooks";
import { googleCertificateService } from "../../services/Google/GoogleCertificateService";
import {
  saveReportGoogle,
  successStatusPayment,
} from "./payment/statusPayment";
import { getCurrentDateMoscow } from "../../utils/getCurrentDate";

export class CertificateCommand extends Command {
  constructor(bot: Telegraf<TBotContext>, instanceBot: any) {
    super(bot, instanceBot);
  }

  handle() {
    // если заказ по сертификату
    this.bot.action(CREATE_ORDER_CERTIFICATE_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      const { getOrderInfo } = useSessionInfo(ctx);

      const certificateRowGoogle = getOrderInfo()?.certificate?.rowInGoogle!;

      await successStatusPayment(ctx, 0, getCurrentDateMoscow());

      await saveReportGoogle(ctx, {
        amount: 0,
        date: getCurrentDateMoscow(),
        orderId: "ЗАКАЗ ПО СЕРТИФИКАТУ",
      });

      await googleCertificateService.setCertificateDateUsage(
        certificateRowGoogle,
      );
    });
  }
}
