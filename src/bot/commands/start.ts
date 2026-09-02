import { Command } from "./command";
import { Telegraf } from "telegraf";
import {
  FAQ_ROUTE,
  SHOW_IMPORTANT_INFO,
  START_ROUTE,
} from "../../configs/routes";
import { createInlineKeyboard } from "../../utils";
import { useSessionInfo } from "../../hooks/useSession";
import { TBotContext } from "../../app/types";
import { orderInProgressTemplate } from "../../template/orderInProgress.template";
import { useGlobalState } from "../../hooks/useGlobalState";
import { consoleLogWithTime } from "../../utils/consoleLogWithTime";
import { startTemplate } from "../../template/start.template";
import { MIN_COUNT_ORDER } from "../../app/constants/constants.order";
import {
  PRICE_DELIVERY_POCHTA,
  PRICE_PRINT_TYPE_WITH_BORDER,
  PRICE_PRINT_TYPE_WITHOUT_BORDER,
} from "../../app/constants/constants.price";
import { URL_OFFERTA } from "../../app/constants/constants.settings";

export const handleStartAction = async (ctx: TBotContext) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery();
  }

  const { clearUserInfo, isGlobalLoading, setReferrerLink } =
    useSessionInfo(ctx);
  const { deletePaymentLink } = useGlobalState(ctx);

  if (isGlobalLoading) {
    await ctx.replyWithHTML(orderInProgressTemplate({}));
    consoleLogWithTime(`🕐 Заказ в обработке`, ctx);
    return;
  }

  await ctx.replyWithHTML(
    startTemplate({
      minOrder: MIN_COUNT_ORDER,
      pricePrintWithBorder: PRICE_PRINT_TYPE_WITH_BORDER,
      pricePrintWithoutBorder: PRICE_PRINT_TYPE_WITHOUT_BORDER,
      priceDelivery: PRICE_DELIVERY_POCHTA,
      urlOfferta: URL_OFFERTA,
    }),
    {
      ...createInlineKeyboard([
        { label: "Заказать фото", action: SHOW_IMPORTANT_INFO },
        { label: "Возник вопрос", action: FAQ_ROUTE },
      ]),
      link_preview_options: { is_disabled: true },
    },
  );

  await deletePaymentLink();
  clearUserInfo();

  setReferrerLink(ctx?.startPayload ?? "");
};

export class StartCommand extends Command {
  constructor(bot: Telegraf<TBotContext>) {
    super(bot);
  }

  handle() {
    this.bot.start(async (ctx) => {
      await handleStartAction(ctx);
    });

    this.bot.action(START_ROUTE, async (ctx) => {
      await handleStartAction(ctx);
    });
  }
}
