import { Worker } from "bullmq";
import { redisConnection } from "../queues/redis";
import { getMockContext } from "../features/getMockContext";
import { Telegraf } from "telegraf";
import { GetEnvKey } from "../features/getEnvKey";
import { TBotContext } from "../app/types";
import { createFolderOnlyFixPhoto } from "../features/createFolderForUserInfo";
import { createInlineKeyboard } from "../utils";
import { ADMIN_SAVE_FIX_PHOTO_ROUTE } from "../configs/routes";
import https from "node:https";

const telegramAgent = new https.Agent({ keepAlive: false });

const telegraf = new Telegraf(new GetEnvKey().get("TG_TOKEN"), {
  telegram: { agent: telegramAgent },
}) as Telegraf<TBotContext>;

export const adminWorker = new Worker(
  "admin_queue",
  async (job) => {
    const { userId, nameFolder, fromId } = job.data;

    try {
      const context = await getMockContext(telegraf, userId);
      if (!context) throw new Error(`Session not found for user: ${userId}`);

      await createFolderOnlyFixPhoto(context, nameFolder);

      await telegraf.telegram.sendMessage(
        fromId,
        `✅ Фото восстановлены для ${userId}`,
        createInlineKeyboard([
          {
            label: "Восстановить ещё",
            action: ADMIN_SAVE_FIX_PHOTO_ROUTE,
          },
        ]),
      );
    } catch (e) {
      await telegraf.telegram.sendMessage(
        fromId,
        `🚫 Ошибка при восстановлении для ${userId}`,
        createInlineKeyboard([
          {
            label: "Восстановить ещё",
            action: ADMIN_SAVE_FIX_PHOTO_ROUTE,
          },
        ]),
      );
      throw e;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
  },
);
