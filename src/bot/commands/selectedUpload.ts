import { Command } from "./command";
import { Telegraf } from "telegraf";
import {
  SELECT_UPLOAD_PHOTO_ROUTE,
  SELECT_UPLOAD_ROUTE,
  SELECT_UPLOAD_YANDEX_DISK_ROUTE,
} from "../../configs/routes";
import { createInlineKeyboard } from "../../utils";
import { SCENE_SAVE_PHOTO } from "../../app/constants/constants.scene";
import { TBotContext } from "../../app/types";
import { selectPrintTypeTemplate } from "../../template/selectUpload.template";

export class SelectedUpload extends Command {
  constructor(bot: Telegraf<TBotContext>) {
    super(bot);
  }

  handle() {
    this.bot.action(SELECT_UPLOAD_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      ctx.replyWithHTML(
        selectPrintTypeTemplate({}),
        createInlineKeyboard([
          {
            label: `Ссылка на Яндекс.Диск`,
            action: SELECT_UPLOAD_YANDEX_DISK_ROUTE,
          },
          {
            label: `Загрузить в чат файлом`,
            action: SELECT_UPLOAD_PHOTO_ROUTE,
          },
        ]),
      );
    });

    this.bot.action(SELECT_UPLOAD_YANDEX_DISK_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      ctx.scene.enter("uploadYandexDisk");
    });

    this.bot.action(SELECT_UPLOAD_PHOTO_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      ctx.scene.enter(SCENE_SAVE_PHOTO);
    });
  }
}
