import { Markup } from "telegraf";

export type CreateInlineKeyboardProps = Array<{
  label: string;
  action: string;
  type?: "url" | "contactRequest" | undefined;
}>;

export const createInlineKeyboard = (list: CreateInlineKeyboardProps) => {
  return Markup.inlineKeyboard(
    list.map((item) => {
      if (item.type === "url") {
        return [Markup.button.url(item.label, item.action)];
      }

      return [Markup.button.callback(item.label, item.action)];
    }),
  );
};
