import { Markup, Telegraf } from "telegraf";
import { Command } from "./command";
import fs from "fs";
import { TBotContext } from "../../app/types";
import { FAQ_ROUTE, START_ROUTE } from "../../configs/routes";

export class FormatCommands extends Command {
  constructor(bot: Telegraf<TBotContext>) {
    super(bot);
  }

  handle() {
    this.bot.action("format", async (ctx) => {
      await ctx.replyWithVideo({
        source: fs.createReadStream("./assets/video_tg_bot.mp4"),
      });

      ctx.replyWithHTML(
        `Как проверить видео формат?`,
        Markup.inlineKeyboard([
          [Markup.button.callback("Вернуться к вопросам", FAQ_ROUTE)],
          [Markup.button.callback("Вернуться на главное меню", START_ROUTE)],
        ]),
      );
    });
  }
}
