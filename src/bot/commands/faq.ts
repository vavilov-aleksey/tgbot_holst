import { Telegraf } from "telegraf";
import { Command } from "./command";
import { config } from "../../configs/config";
import {
  FAQ_DELIVERY_ROUTE,
  FAQ_EXAMPLE_ROUTE,
  FAQ_FORMAT_ROUTE,
  FAQ_MAKE_ON_ORDER_ROUTE,
  FAQ_PAY_ROUTE,
  FAQ_ROUTE,
} from "../../configs/routes";
import { createInlineKeyboard } from "../../utils";
import fs from "fs";
import { TBotContext } from "../../app/types";

export const handleFaqAction = (ctx: TBotContext) => {
  const configInfo = config[FAQ_ROUTE];

  ctx.replyWithHTML(
    configInfo.text,
    createInlineKeyboard(configInfo.navigation as any),
  );
};

export class FaqCommands extends Command {
  constructor(bot: Telegraf<TBotContext>) {
    super(bot);
  }

  handleFaq(ctx: TBotContext) {
    handleFaqAction(ctx);
  }

  handle() {
    this.bot.command(FAQ_ROUTE, (ctx) => {
      this.handleFaq(ctx);
    });

    this.bot.action(FAQ_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      this.handleFaq(ctx);
    });

    this.bot.action(FAQ_DELIVERY_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      const configInfo = config[FAQ_DELIVERY_ROUTE];

      ctx.replyWithHTML(
        configInfo.text,
        createInlineKeyboard(configInfo.navigation),
      );
    });

    this.bot.action(FAQ_EXAMPLE_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      const configInfo = config[FAQ_EXAMPLE_ROUTE];

      await ctx.replyWithPhoto(
        {
          source: fs.createReadStream("./assets/foto_tg_bot.jpg"),
        },
        {
          caption: configInfo.text,
          parse_mode: "Markdown",
          ...createInlineKeyboard(configInfo.navigation),
        },
      );
    });

    this.bot.action(FAQ_MAKE_ON_ORDER_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      const configInfo = config[FAQ_MAKE_ON_ORDER_ROUTE];

      ctx.replyWithHTML(
        configInfo.text,
        createInlineKeyboard(configInfo.navigation),
      );
    });

    this.bot.action(FAQ_PAY_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      const configInfo = config[FAQ_PAY_ROUTE];

      ctx.replyWithHTML(
        configInfo.text,
        createInlineKeyboard(configInfo.navigation),
      );
    });

    this.bot.action(FAQ_FORMAT_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      const configInfo = config[FAQ_FORMAT_ROUTE];

      try {
        await ctx.replyWithVideo(
          {
            source: fs.createReadStream("./assets/video_tg_bot.mp4"),
          },
          {
            caption: configInfo.text,
            parse_mode: "Markdown",
            ...createInlineKeyboard(configInfo.navigation),
          },
        );
      } catch (e) {
        console.error("Ошибка в FAQ_FORMAT_ROUTE");
        await ctx.replyWithHTML(
          `⚠️ Видео временно недоступно. Попробуйте позже.`,
          createInlineKeyboard(configInfo.navigation),
        );
      }
    });
  }
}
