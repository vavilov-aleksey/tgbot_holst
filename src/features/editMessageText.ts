import { TBotContext } from "../app/types";
import { FmtString } from "telegraf/format";
import { createInlineKeyboard } from "../utils";
import { CreateInlineKeyboardProps } from "../utils/createInlineKeyboard";

export const editMessageText = async (
  ctx: TBotContext,
  {
    message,
    keyboard,
  }: { message: string | FmtString; keyboard?: CreateInlineKeyboardProps },
) => {
  const inlineKeyboard = keyboard ? createInlineKeyboard(keyboard) : {};

  try {
    await ctx.editMessageText(message, {
      parse_mode: "HTML",
      ...inlineKeyboard,
    });
  } catch (e) {
    await ctx.replyWithHTML(message as string, {
      parse_mode: "HTML",
      ...inlineKeyboard,
    });
  }
};
