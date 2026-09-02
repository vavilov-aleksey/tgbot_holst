import { Telegraf } from "telegraf";
import { Command } from "../command";
import {
  PAYMENT_CHECK_PAYMENT_STATUS,
  PAYMENT_CONFIRM_AND_PAY,
  PAYMENT_SELECTED_METHOD,
  PAYMENT_STATUS,
} from "../../../configs/routes";
import { confirmAndPay } from "./confirmAndPay";
import { checkPaymentStatus } from "./checkPaymentStatus";
import { statusPayment } from "./statusPayment";
import { TBotContext } from "../../../app/types";
import { paymentSelectedMethod } from "./paymentSelectedMethod";

export class PaymentCommands extends Command {
  constructor(bot: Telegraf<TBotContext>, instanceBot: any) {
    super(bot, instanceBot);
  }

  handle() {
    this.bot.action(PAYMENT_CONFIRM_AND_PAY, async (ctx) => confirmAndPay(ctx));

    this.bot.action(PAYMENT_CHECK_PAYMENT_STATUS, async (ctx) =>
      checkPaymentStatus(ctx),
    );

    this.bot.action(PAYMENT_STATUS, async (ctx) => statusPayment(ctx));

    this.bot.action(PAYMENT_SELECTED_METHOD, async (ctx) =>
      paymentSelectedMethod(ctx),
    );
  }
}
