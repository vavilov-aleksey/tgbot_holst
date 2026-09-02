import { TBotContext } from "../app/types";

// использовать в app.ts
export const getMockContext = async (instanceBot: any, userId: string) => {
  const db = await instanceBot.localSession.DB.getState();
  const sessions = db.sessions;

  if (!sessions || !Array.isArray(sessions)) {
    console.log("❌ Sessions not found");
    await instanceBot.bot.telegram.sendMessage(
      userId,
      "❌ Ошибка: сессии не найдены",
    );
    return;
  }

  // Ищем сессию пользователя
  const userSessionObj = sessions.find(
    (session) =>
      session?.id === userId || session?.id === `${userId}:${userId}`,
  );

  if (!userSessionObj || !userSessionObj.data) {
    console.log("❌ Session not found for user:", userId);
    await instanceBot.bot.telegram.sendMessage(
      userId,
      "❌ Сессия не найдена. Начните с /start",
    );
    return;
  }

  // Создаем контекст для обработчиков
  const sessionKey = userSessionObj.id;
  const mockCtx = {
    session: userSessionObj.data,
    from: { id: parseInt(userId) },
    telegram: instanceBot.bot.telegram,
    reply: (text: string, extra?: any) =>
      instanceBot.bot.telegram.sendMessage(userId, text, extra),
    replyWithHTML: (text: string, extra?: any) =>
      instanceBot.bot.telegram.sendMessage(userId, text, {
        ...extra,
        parse_mode: "HTML",
      }),
    deleteMessage: (messageId: number) =>
      instanceBot.bot.telegram.deleteMessage(userId, messageId),
    replyWithPhoto: (photo: any, extra?: any) =>
      instanceBot.bot.telegram.sendPhoto(userId, photo, extra),
    persistSession: async () => {
      await instanceBot.localSession.saveSession(
        sessionKey,
        userSessionObj.data,
      );
    },
  } as TBotContext;

  return mockCtx;
};
