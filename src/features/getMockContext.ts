import { TBotContext } from "../app/types";
import { Telegraf } from "telegraf";
import { sessionStorage } from "../services/sessionStorage";

// использовать в app.ts
export const getMockContext = async (
  telegraf: Telegraf<TBotContext>,
  userId: string | number,
) => {
  const session =
    sessionStorage.get(`${userId}`) ??
    sessionStorage.get(`${userId}:${userId}`);

  if (!session) {
    console.log("❌ Sessions not found", userId);
    return;
  }

  // Создаем контекст для обработчиков
  const mockCtx = {
    session: session,
    from: { id: parseInt(`${userId}`) },
    telegram: telegraf.telegram,
    reply: (text: string, extra?: any) =>
      telegraf.telegram.sendMessage(userId, text, extra),
    replyWithHTML: (text: string, extra?: any) =>
      telegraf.telegram.sendMessage(userId, text, {
        ...extra,
        parse_mode: "HTML",
      }),
    deleteMessage: (messageId: number) =>
      telegraf.telegram.deleteMessage(userId, messageId),
    replyWithPhoto: (photo: any, extra?: any) =>
      telegraf.telegram.sendPhoto(userId, photo, extra),
    persistSession: async () => {
      await sessionStorage.save(`${userId}:${userId}`, session);
    },
  } as TBotContext;

  return mockCtx;
};
