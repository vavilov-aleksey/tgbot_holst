import { TBotContext } from "../../../app/types";
import { selectedPaymentMethodTemplate } from "../../../template/selectedPaymentMethod.template";

export const paymentSelectedMethod = async (ctx: TBotContext) => {
  await ctx.replyWithHTML(selectedPaymentMethodTemplate({}));
};
