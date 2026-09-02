import { Command } from "./command";
import { Telegraf } from "telegraf";
import {
  FAQ_FORMAT_ROUTE,
  SELECT_PRINT_TYPE_ROUTE,
  SHOW_IMPORTANT_INFO,
} from "../../configs/routes";
import { createInlineKeyboard } from "../../utils";
import { TBotContext } from "../../app/types";
import { importantTemplate } from "../../template/importantInfo.template";

export class ShowImportantInfoCommand extends Command {
  constructor(bot: Telegraf<TBotContext>) {
    super(bot);
  }

  handle() {
    this.bot.action(SHOW_IMPORTANT_INFO, async (ctx) => {
      await ctx.answerCbQuery();

      ctx.replyWithHTML(
        importantTemplate({}),
        createInlineKeyboard([
          {
            label: "Сделать заказ",
            action: SELECT_PRINT_TYPE_ROUTE,
          },
          { label: "Как проверить формат?", action: FAQ_FORMAT_ROUTE },
        ]),
      );
    });
  }
}
