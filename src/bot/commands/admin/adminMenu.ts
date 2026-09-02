import { TBotContext } from "../../../app/types";
import { createInlineKeyboard } from "../../../utils";
import {
  ADMIN_ADD_CERTIFICATE_ROUTE,
  ADMIN_ADD_GIFT_ROUTE,
  ADMIN_CHECK_FOLDER_ROUTE,
  ADMIN_GET_PHOTOS_COUNT_ROUTE,
  ADMIN_SAVE_FIX_PHOTO_ROUTE,
  ADMIN_SEND_MESSAGE_ALL_ROUTE,
  ADMIN_SEND_MESSAGE_REGULAR_ROUTE,
  ADMIN_SEND_MESSAGE_ROUTE,
} from "../../../configs/routes";
import {
  ADMIN_ID,
  SUPER_ADMIN_ID,
  SUPPORT_ADMIN_ID,
} from "../../../app/constants/constants.settings";

export const adminMenu = async (ctx: TBotContext) => {
  const chatId = String(ctx?.from?.id);

  // Для маркетолога. Костыль
  if (chatId === "1964383566") {
    await ctx.replyWithHTML(
      "Выберите действие:",
      createInlineKeyboard([
        {
          label: "📅 Статистика фото за выбранную дату",
          action: ADMIN_GET_PHOTOS_COUNT_ROUTE,
        },
      ]),
    );

    return;
  }

  if ([SUPER_ADMIN_ID, ADMIN_ID, SUPPORT_ADMIN_ID].includes(chatId)) {
    const listKeyboard = [
      {
        label: "✍️ Написать пользователю",
        action: ADMIN_SEND_MESSAGE_ROUTE,
      },
      {
        label: "🎁 Добавить подарок",
        action: ADMIN_ADD_GIFT_ROUTE,
      },
      {
        label: "📝 Добавить сертификат",
        action: ADMIN_ADD_CERTIFICATE_ROUTE,
      },
      {
        label: "🏁 Проверка заказов",
        action: ADMIN_CHECK_FOLDER_ROUTE,
      },
      {
        label: "📅 Статистика фото за выбранную дату",
        action: ADMIN_GET_PHOTOS_COUNT_ROUTE,
      },
    ];

    if ([SUPER_ADMIN_ID, ADMIN_ID].includes(chatId)) {
      listKeyboard.push({
        label: "✍️ Написать всем",
        action: ADMIN_SEND_MESSAGE_ALL_ROUTE,
      });
      listKeyboard.push({
        label: "✍️ Написать постоянным",
        action: ADMIN_SEND_MESSAGE_REGULAR_ROUTE,
      });
    }

    if ([SUPER_ADMIN_ID].includes(chatId)) {
      listKeyboard.push({
        label: "🔧 Восстановить фото",
        action: ADMIN_SAVE_FIX_PHOTO_ROUTE,
      });
    }

    await ctx.replyWithHTML(
      "Выберите действие:",
      createInlineKeyboard(listKeyboard),
    );
  }
};
