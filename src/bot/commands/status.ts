import { Command } from "./command";
import { TBotContext } from "../../app/types";
import { START_ROUTE, STATUS_ROUTE } from "../../configs/routes";
import { Telegraf } from "telegraf";
import { googleReportService } from "../../services/Google/GoogleReportService";
import {
  statusAlreadyReadyTemplate,
  statusInProgressTemplate,
  statusNotFoundTemplate,
} from "../../template/statusOrder.template";
import { StatusOrderEnum } from "../../services/Google/GoogleTypes";
import { createInlineKeyboard } from "../../utils";
import { SUPPORT_TG_SUPPORT } from "../../app/constants/constants.support";
import { consoleLogWithTime } from "../../utils/consoleLogWithTime";

export const handleStatusAction = async (ctx: TBotContext) => {
  consoleLogWithTime("Проверка статуса заказа: ", ctx);
  const message = await ctx.replyWithHTML(`Уточняем статус, ожидайте...`);

  const { status } = await googleReportService.checkDateOrder(
    ctx?.from?.id?.toString()!,
  );

  if (status === StatusOrderEnum.notFound) {
    await ctx.replyWithHTML(
      statusNotFoundTemplate({}),
      createInlineKeyboard([
        {
          label: "Поддержка",
          action: SUPPORT_TG_SUPPORT,
          type: "url",
        },
        { label: "Оформить заказ", action: START_ROUTE },
      ]),
    );
  }

  if (status === StatusOrderEnum.inProgress) {
    await ctx.replyWithHTML(
      statusInProgressTemplate({}),
      createInlineKeyboard([
        { label: "Оформить новый заказ", action: START_ROUTE },
      ]),
    );
  }

  if (status === StatusOrderEnum.alreadyRead) {
    await ctx.replyWithHTML(
      statusAlreadyReadyTemplate({}),
      createInlineKeyboard([
        { label: "Оформить новый заказ", action: START_ROUTE },
      ]),
    );
  }

  try {
    await ctx.deleteMessage(message?.message_id);
  } catch (error) {}
};

export class StatusCommand extends Command {
  constructor(bot: Telegraf<TBotContext>) {
    super(bot);
  }

  handle() {
    this.bot.command(STATUS_ROUTE, async (ctx: TBotContext) => {
      await handleStatusAction(ctx);
    });

    this.bot.action(STATUS_ROUTE, async (ctx: TBotContext) => {
      await handleStatusAction(ctx);
    });
  }
}
