import { Command } from "./command";
import { Telegraf } from "telegraf";
import {
  EDIT_ALL_USER_INFO,
  FAQ_EXAMPLE_ROUTE,
  SELECT_DELIVERY_CDEK_NEXT_STEP_ROUTE,
  SELECT_PRINT_TYPE_ROUTE,
} from "../../configs/routes";
import { createInlineKeyboard } from "../../utils";
import { useSessionInfo } from "../../hooks";
import {
  PRICE_PRINT_TYPE_BIG,
  PRICE_PRINT_TYPE_SMALL,
} from "../../app/constants/constants.price";
import { TBotContext } from "../../app/types";
import { selectPrintTypeTemplate } from "../../template/selectPrintType.template";
import {
  SCENE_GET_INDEX_CDEK,
  SCENE_USERNAME,
} from "../../app/constants/constants.scene";

export class SelectPrintTypeCommand extends Command {
  constructor(bot: Telegraf<TBotContext>) {
    super(bot);
  }

  handle() {
    // Если выбираем фото или редактируем все поля
    this.bot.action(
      [SELECT_PRINT_TYPE_ROUTE, EDIT_ALL_USER_INFO],
      async (ctx) => {
        await ctx.answerCbQuery();

        const isEditInfo = ctx.match["input"] === EDIT_ALL_USER_INFO;

        if (isEditInfo) {
          const { clearUserInfo } = useSessionInfo(ctx);

          clearUserInfo();
        }

        ctx.editMessageText(selectPrintTypeTemplate({}), {
          ...createInlineKeyboard([
            {
              label: `40*50 - ${PRICE_PRINT_TYPE_SMALL} рублей`,
              action: `${SELECT_PRINT_TYPE_ROUTE}_${PRICE_PRINT_TYPE_SMALL}`,
            },
            {
              label: `50*70 - ${PRICE_PRINT_TYPE_BIG} рублей`,
              action: `${SELECT_PRINT_TYPE_ROUTE}_${PRICE_PRINT_TYPE_BIG}`,
            },
            { label: "Покажите пример", action: FAQ_EXAMPLE_ROUTE },
          ]),
          parse_mode: "HTML",
        });
      },
    );

    // Выбрали стоимость фото
    this.bot.action(
      `${SELECT_PRINT_TYPE_ROUTE}_${PRICE_PRINT_TYPE_SMALL}`,
      async (ctx) => {
        await ctx.answerCbQuery();
        const { setPhotoInfo, clearUserInfo } = useSessionInfo(ctx);

        // очищаем всю инфу. т.к выбор типа фото, всегда сбрасывает информацию
        clearUserInfo();

        setPhotoInfo({ type: PRICE_PRINT_TYPE_SMALL });
        ctx.scene.enter(SCENE_GET_INDEX_CDEK);
      },
    );

    // Выбрали стоимость фото
    this.bot.action(
      `${SELECT_PRINT_TYPE_ROUTE}_${PRICE_PRINT_TYPE_BIG}`,
      async (ctx) => {
        await ctx.answerCbQuery();
        const { setPhotoInfo, clearUserInfo } = useSessionInfo(ctx);

        // очищаем всю инфу. т.к выбор типа фото, всегда сбрасывает информацию
        clearUserInfo();

        setPhotoInfo({ type: PRICE_PRINT_TYPE_BIG });
        ctx.scene.enter(SCENE_GET_INDEX_CDEK);
      },
    );

    // может не совсем тут должен лежать
    this.bot.action(SELECT_DELIVERY_CDEK_NEXT_STEP_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      ctx.scene.enter(SCENE_USERNAME);
    });
  }
}
