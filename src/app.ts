import { GetEnvKey, TGetEnvKey } from "./features/getEnvKey";
import { Telegraf } from "telegraf";
import { Command } from "./bot/commands/command";
import LocalSession from "telegraf-session-local";
import { config } from "./configs/config";
import express from "express";
import {
  declinedByTimeoutStatusText,
  saveReportGoogle,
  successStatusPayment,
} from "./bot/commands/payment/statusPayment";
import { AlfaBankWebhookType, TBotContext } from "./app/types";
import { SCENE_SAVE_PHOTO } from "./app/constants/constants.scene";
import { createInlineKeyboard } from "./utils";
import { START_ROUTE } from "./configs/routes";
import { IS_DEVELOPMENT_MODE } from "./app/constants/constants.settings";
import { NotificationService } from "./services/notificationService";
import { consoleLogWithTime } from "./utils/consoleLogWithTime";
import { cleanupOldSessions } from "./utils/cleanupOldSessions";
import { useSessionInfo } from "./hooks";
import { commandsProvider } from "./bot/commands";
import { scenesProvider } from "./bot/scenes";

class Bot {
  bot: Telegraf<TBotContext>;
  commands: Command[] = [];
  private expressApp: express.Application;
  private serverPort: number;
  private timer: NodeJS.Timeout | null;
  private messageInfoId: any | null;
  private localSession: any;

  constructor(private readonly getEnvKey: TGetEnvKey) {
    this.timer = null;
    this.messageInfoId = null;

    this.bot = new Telegraf<TBotContext>(this.getEnvKey.get("TG_TOKEN"), {
      handlerTimeout: 9_000_000,
    });
    this.expressApp = express();
    this.serverPort = Number(this.getEnvKey.get("PORT")) || 3002;

    // установка сессии (FileAsync — без writeFileSync на каждый апдейт)
    this.localSession = new LocalSession({
      database: "sessions.json",
      storage: LocalSession.storageFileAsync,
    });
    this.bot.use(this.localSession.middleware());
    this.bot.use((ctx, next) => {
      ctx.persistSession = async () => {
        const key = this.localSession.getSessionKey(ctx);
        if (!key) return;
        await this.localSession.saveSession(key, ctx.session);
      };
      return next();
    });

    // Инициализация Express middleware
    this.expressApp.use(express.json());
    this.expressApp.use(express.urlencoded({ extended: true }));

    this.bot.catch(async (error, ctx) => {
      const notification = new NotificationService(ctx);

      await notification.sendError(
        error as Error,
        {
          updateType: ctx.updateType,
          update: ctx.update,
        },
        ctx.from?.id,
      );

      // Отправляем пользователю сообщение об ошибке
      try {
        await ctx.replyWithHTML(
          `⚠️ <b>Произошла ошибка. Мы уже работаем над исправлением.</b>

Чтобы избежать ошибок в обработке вашего заказа, пожалуйста:

- Перезапустите бота

Это гарантирует, что все данные сохранятся правильно и фото будут напечатаны без ошибок!`,
          createInlineKeyboard([
            {
              label: "Перезапустить бота",
              action: START_ROUTE,
            },
          ]),
        );
      } catch (replyError) {
        // Игнорируем ошибки отправки пользователю
      }
    });
  }

  private errorPhotoText = async (ctx: TBotContext) => {
    if (this.messageInfoId) {
      try {
        await ctx.deleteMessage(this.messageInfoId);
      } catch (e) {}
    }

    const message = await ctx.replyWithHTML(
      `⚠️ <b>Загрузка изображения будет доступна позже</b>

Чтобы избежать ошибок в обработке вашего заказа, пожалуйста:

1. Перезапустите бота
2. Следуйте инструкциям по шагам

Это гарантирует, что все данные сохранятся правильно и холсты будут напечатаны без ошибок!`,
      createInlineKeyboard([
        {
          label: "Перезапустить бота",
          action: START_ROUTE,
        },
      ]),
    );

    consoleLogWithTime("Загрузка фото будет доступна позже", ctx);

    this.messageInfoId = message.message_id;
  };

  async init() {
    // Ждём инициализации async lowdb, иначе getSession/saveSession на старте могут упасть
    await this.localSession.DB;
    await cleanupOldSessions(this.localSession);

    this.bot.use(scenesProvider(this));

    this.bot.use((ctx, next) => {
      const { getGlobalState, setGlobalState } = useSessionInfo(ctx);

      const { errorUploadPhotosOutsideScene } = getGlobalState() || {};
      // Если пользователь не в сцене загрузки фото и отправляет фото
      if (
        // @ts-ignore
        ctx.message?.photo &&
        !ctx.scene?.current?.id?.includes(SCENE_SAVE_PHOTO) &&
        !errorUploadPhotosOutsideScene
      ) {
        setGlobalState({ errorUploadPhotosOutsideScene: true });
        if (this.timer) {
          clearTimeout(this.timer);
        }

        this.timer = setTimeout(async () => {
          await this.errorPhotoText(ctx);
        }, 2000);
      }
      return next();
    });

    this.bot.telegram.setMyCommands(config.myCommands).then(() => {
      // console.log("setMyCommands");
    });

    // this.bot.telegram.setChatMenuButton({
    //   menuButton: {
    //     type: "commands",
    //   },
    // });

    this.commands = commandsProvider(this.bot, this);

    for (const command of this.commands) {
      command.handle();
    }

    // Добавляем обработчики Express
    this.initExpressRoutes();

    // Запускаем сервер Express
    this.expressApp.listen(this.serverPort, "127.0.0.1", () => {
      console.log(`Express server is running on port ${this.serverPort}`);
      if (!IS_DEVELOPMENT_MODE) this.setupWebhook();
    });

    if (IS_DEVELOPMENT_MODE) {
      this.bot.launch();
    } else {
      this.bot.launch({
        webhook: {
          domain: "paryginphoto.ru",
          port: 8091,
          hookPath: "/webhook-holst",
        },
      });
    }
  }

  private async setupWebhook() {
    try {
      const webhookUrl = `https://paryginphoto.ru/webhook-holst`;

      // Устанавливаем webhook вручную для большего контроля
      await this.bot.telegram.setWebhook(webhookUrl, {
        drop_pending_updates: true,
        allowed_updates: ["message", "callback_query", "inline_query"],
      });

      console.log("✅ Webhook успешно установлен:", webhookUrl);

      // Проверяем информацию о webhook
      const webhookInfo = await this.bot.telegram.getWebhookInfo();
      console.log("📊 Webhook info:", webhookInfo);
    } catch (error) {
      console.error("❌ Ошибка установки webhook:", error);
    }
  }

  private initExpressRoutes() {
    this.expressApp.use(this.bot.webhookCallback("/webhook-holst"));

    // Настройка роута для вебхука Альфа-Банка
    this.expressApp.get(
      "/api/alpha/holst/webhook",
      express.json(),
      async (req, res) => {
        res.status(200).send("OK");

        try {
          const paymentData: Partial<AlfaBankWebhookType> = req.query;
          const arrayOrderNumber = paymentData?.orderNumber?.split("_");
          const userId = arrayOrderNumber?.pop();

          if (!userId) {
            console.log("❌ No user ID found in webhook");
            return;
          }

          // Получаем сессию из базы
          const db = await this.localSession.DB.getState();
          const sessions = db.sessions;

          if (!sessions || !Array.isArray(sessions)) {
            console.log("❌ Sessions not found");
            await this.bot.telegram.sendMessage(
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
            await this.bot.telegram.sendMessage(
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
            telegram: this.bot.telegram,
            reply: (text: string, extra?: any) =>
              this.bot.telegram.sendMessage(userId, text, extra),
            replyWithHTML: (text: string, extra?: any) =>
              this.bot.telegram.sendMessage(userId, text, {
                ...extra,
                parse_mode: "HTML",
              }),
            deleteMessage: (messageId: number) =>
              this.bot.telegram.deleteMessage(userId, messageId),
            replyWithPhoto: (photo: any, extra?: any) =>
              this.bot.telegram.sendPhoto(userId, photo, extra),
            persistSession: async () => {
              await this.localSession.saveSession(
                sessionKey,
                userSessionObj.data,
              );
            },
          } as TBotContext;

          consoleLogWithTime(
            `💸 Payment data: ${JSON.stringify(paymentData)}`,
            mockCtx,
          );

          const isCertificatePayment =
            arrayOrderNumber?.includes("certificate");

          // Обработка платежа
          if (
            paymentData.operation === "deposited" &&
            !!Number(paymentData?.approvedAmount)
          ) {
            await successStatusPayment(
              mockCtx,
              paymentData?.approvedAmount!,
              paymentData?.paymentDate!,
            );

            await saveReportGoogle(mockCtx, {
              amount: paymentData?.approvedAmount! / 100,
              date: paymentData?.paymentDate!,
              orderId: paymentData?.orderNumber!,
            });
          } else if (paymentData.operation === "declinedByTimeout") {
            console.log(
              `DeclinedByTimeout: ${JSON.stringify(paymentData)}, userId: ${userId}`,
            );
            if (!isCertificatePayment) {
              await declinedByTimeoutStatusText(mockCtx);
            }
          }

          await mockCtx.persistSession?.();
        } catch (error) {
          console.error("❌ Webhook processing error:", error);
        }
      },
    );
  }
}

const bot = new Bot(new GetEnvKey());
void bot.init();

// cd ./tgbot_holst/
// pm2 stop holstBot
// git pull origin master
// bun run build
// pm2 start dist/app.js --name holstBot
// pm2 flush
// pm2 logs --lines 10000
// Настройка nginx
// https://habr.com/ru/companies/selectel/articles/803599/
// ./createTrackNumberBot/create-track-number-pochta-bot
// бекап перед стартом cp sessions.json sessions.json.backup-$(date +%F-%H%M)
