import { Worker } from "bullmq";
import { redisConnection } from "../queues/redis";
import { getMockContext } from "../features/getMockContext";
import { Telegraf } from "telegraf";
import { GetEnvKey } from "../features/getEnvKey";
import { runPostPaymentProcessing } from "../bot/commands/payment/statusPayment";
import { TBotContext } from "../app/types";
import https from "node:https";

const telegramAgent = new https.Agent({ keepAlive: false });

const telegraf = new Telegraf(new GetEnvKey().get("TG_TOKEN"), {
  telegram: { agent: telegramAgent },
}) as Telegraf<TBotContext>;

export const paymentWorker = new Worker(
  "payment_queue",
  async (job) => {
    const { userId } = job.data;

    const context = await getMockContext(telegraf, userId);
    if (!context) throw new Error(`Session not found for user: ${userId}`);

    await runPostPaymentProcessing(context);
  },
  {
    connection: redisConnection,
    concurrency: 3,
  },
);
