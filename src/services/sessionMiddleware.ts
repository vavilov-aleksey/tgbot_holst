import { TBotContext } from "../app/types";
import { sessionStorage } from "./sessionStorage";

export const getSessionKey = (ctx: TBotContext): string | undefined => {
  if (!ctx.from) return undefined;

  let chatInstance;
  if (ctx.chat) chatInstance = ctx.chat.id;
  else if (ctx.updateType === "callback_query")
    chatInstance = ctx?.callbackQuery?.chat_instance;
  else chatInstance = ctx.from.id;

  return `${chatInstance}:${ctx.from.id}`;
};

export const sessionMiddleware =
  () => async (ctx: TBotContext, next: () => Promise<void>) => {
    const key = getSessionKey(ctx);
    if (!key) return next();

    const stored = sessionStorage.get(key);
    ctx.session = (stored ?? {}) as TBotContext["session"];

    await next();

    // повторяем поведение telegraf-session-local: пустые сессии не храним
    if (Object.keys(ctx.session).length === 0) {
      sessionStorage.remove(key);
    } else {
      sessionStorage.save(key, ctx.session);
    }
  };
