import { Command } from "../command";
import { Telegraf } from "telegraf";
import { TBotContext } from "../../../app/types";
import {
  ADMIN_ADD_CERTIFICATE_ROUTE,
  ADMIN_ADD_GIFT_ROUTE,
  ADMIN_CHECK_FOLDER_ROUTE,
  ADMIN_GET_PHOTOS_COUNT_ROUTE,
  ADMIN_MENU_ROUTE,
  ADMIN_SAVE_FIX_PHOTO_ROUTE,
  ADMIN_SEND_MESSAGE_ALL_ROUTE,
  ADMIN_SEND_MESSAGE_REGULAR_ROUTE,
  ADMIN_SEND_MESSAGE_ROUTE,
} from "../../../configs/routes";
import { adminMenu } from "./adminMenu";
import {
  SCENE_ADMIN_ADD_CERTIFICATE,
  SCENE_ADMIN_ADD_GIFT,
  SCENE_ADMIN_CHECK_FOLDER,
  SCENE_ADMIN_GET_PHOTOS_COUNT,
  SCENE_ADMIN_SAVE_FIX_PHOTO,
  SCENE_ADMIN_SEND_MESSAGE,
  SCENE_ADMIN_SEND_MESSAGE_ALL,
  SCENE_ADMIN_SEND_MESSAGE_REGULAR,
} from "../../../app/constants/constants.scene";

export class AdminCommands extends Command {
  constructor(bot: Telegraf<TBotContext>, instanceBot: any) {
    super(bot, instanceBot);
  }

  handle() {
    this.bot.command(ADMIN_MENU_ROUTE, async (ctx) => {
      await adminMenu(ctx);
    });

    this.bot.action(ADMIN_SEND_MESSAGE_ALL_ROUTE, async (ctx) => {
      await ctx.scene.enter(SCENE_ADMIN_SEND_MESSAGE_ALL);
    });

    this.bot.action(ADMIN_SEND_MESSAGE_REGULAR_ROUTE, async (ctx) => {
      await ctx.scene.enter(SCENE_ADMIN_SEND_MESSAGE_REGULAR);
    });

    this.bot.action(ADMIN_SEND_MESSAGE_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.scene.enter(SCENE_ADMIN_SEND_MESSAGE);
    });

    // gift
    this.bot.action(ADMIN_ADD_GIFT_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.scene.enter(SCENE_ADMIN_ADD_GIFT);
    });

    // certificate
    this.bot.action(ADMIN_ADD_CERTIFICATE_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.scene.enter(SCENE_ADMIN_ADD_CERTIFICATE);
    });

    // сравнение загруженных оплаченных фото
    this.bot.action(ADMIN_CHECK_FOLDER_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.scene.enter(SCENE_ADMIN_CHECK_FOLDER);
    });

    // восстановление фото с загрузкой в ЯД
    this.bot.action(ADMIN_SAVE_FIX_PHOTO_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.scene.enter(SCENE_ADMIN_SAVE_FIX_PHOTO);
    });

    // узнать количество фото за выбранную дату
    this.bot.action(ADMIN_GET_PHOTOS_COUNT_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.scene.enter(SCENE_ADMIN_GET_PHOTOS_COUNT);
    });
  }
}
