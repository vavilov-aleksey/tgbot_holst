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
  PRICE_PRINT_TYPE_WITH_BORDER,
  PRICE_PRINT_TYPE_WITHOUT_BORDER,
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
              label: `С рамкой - ${PRICE_PRINT_TYPE_WITH_BORDER} рублей`,
              action: `${SELECT_PRINT_TYPE_ROUTE}_${PRICE_PRINT_TYPE_WITH_BORDER}`,
            },
            {
              label: `Без рамки - ${PRICE_PRINT_TYPE_WITHOUT_BORDER} рублей`,
              action: `${SELECT_PRINT_TYPE_ROUTE}_${PRICE_PRINT_TYPE_WITHOUT_BORDER}`,
            },
            { label: "Покажите пример", action: FAQ_EXAMPLE_ROUTE },
          ]),
          parse_mode: "HTML",
        });
      },
    );

    // Выбрали стоимость фото
    this.bot.action(
      `${SELECT_PRINT_TYPE_ROUTE}_${PRICE_PRINT_TYPE_WITH_BORDER}`,
      async (ctx) => {
        await ctx.answerCbQuery();
        const { setPhotoInfo, clearUserInfo } = useSessionInfo(ctx);

        // очищаем всю инфу. т.к выбор типа фото, всегда сбрасывает информацию
        clearUserInfo();

        setPhotoInfo({ type: PRICE_PRINT_TYPE_WITH_BORDER });
        ctx.scene.enter(SCENE_GET_INDEX_CDEK);
      },
    );

    // Выбрали стоимость фото
    this.bot.action(
      `${SELECT_PRINT_TYPE_ROUTE}_${PRICE_PRINT_TYPE_WITHOUT_BORDER}`,
      async (ctx) => {
        await ctx.answerCbQuery();
        const { setPhotoInfo, clearUserInfo } = useSessionInfo(ctx);

        // очищаем всю инфу. т.к выбор типа фото, всегда сбрасывает информацию
        clearUserInfo();

        setPhotoInfo({ type: PRICE_PRINT_TYPE_WITHOUT_BORDER });
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
