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
import { URL_OFFERTA } from "../../app/constants/constants.settings";
import {
  PRICE_DELIVERY,
  PRICE_PRINT_TYPE_BIG,
  PRICE_PRINT_TYPE_SMALL,
} from "../../app/constants/constants.price";
import { pluralize } from "../../utils/pluralize";

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
      minOrder: `${MIN_COUNT_ORDER} ${pluralize(MIN_COUNT_ORDER, "холста", "холстов", "холстов")}`,
      pricePrintSmall: PRICE_PRINT_TYPE_SMALL,
      pricePrintBig: PRICE_PRINT_TYPE_BIG,
      priceDelivery: PRICE_DELIVERY,
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
