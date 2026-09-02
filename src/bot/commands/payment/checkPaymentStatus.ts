import { createInlineKeyboard } from "../../../utils";
import { PAYMENT_STATUS } from "../../../configs/routes";
import { TBotContext } from "../../../app/types";

export const checkPaymentStatus = async (ctx: TBotContext) => {
  await ctx.replyWithHTML(
    `✅ <b>Проверка оплаты</b>

Если вы уже совершили платеж:
• Нажмите <b>"Проверить оплату"</b> - мы обновим статус`,
    createInlineKeyboard([
      { label: "Проверить оплату", action: PAYMENT_STATUS } as any,
    ]),
  );
};
