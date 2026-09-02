import { handleStartAction } from "./start";
import { Markup } from "telegraf";
import { handleFaqAction } from "./faq";
import { TBotContext } from "../../app/types";
import { adminMenu } from "./admin/adminMenu";
import { handleFeedbackAction } from "./feedback";
import { handleStatusAction } from "./status";

type TCommandHandlers = {
  [key: string]: (ctx: TBotContext) => void;
};

const commandHandlers: TCommandHandlers = {
  start: (ctx: TBotContext) => handleStartAction(ctx),
  faq: (ctx: TBotContext) => handleFaqAction(ctx),
  admin: (ctx: TBotContext) => adminMenu(ctx),
  feedback: (ctx: TBotContext) => handleFeedbackAction(ctx),
  status: (ctx: TBotContext) => handleStatusAction(ctx),
};

const getTextCommand = (text: string) => {
  if (text?.startsWith("/")) {
    return text.slice(1).toLowerCase();
  }
  return null;
};

export const sceneReset = async (ctx: TBotContext, text: string) => {
  const commandName = getTextCommand(text);

  if (commandName && commandHandlers[commandName]) {
    await ctx.scene.leave();
    // пока костыль, чтобы удалить клавиатуру
    const messageLoading = await ctx.replyWithHTML(
      `Загрузка...`,
      Markup.removeKeyboard(),
    );
    try {
      await ctx.deleteMessage(messageLoading.message_id);
    } catch (e) {
      console.log("❌ Не удалось удалить сообщение в sceneReset:", e);
    }

    await commandHandlers[commandName](ctx);
    return true;
  } else {
    return null;
  }
};
