import { Scenes } from "telegraf";
import { sceneReset } from "../../commands/sceneReset";
import { SCENE_ADMIN_SEND_MESSAGE_ALL } from "../../../app/constants/constants.scene";
import { SendMessageServices } from "../../../services/SendMessageServices";
import { createInlineKeyboard } from "../../../utils";
import { ADMIN_SEND_MESSAGE_ALL_ROUTE } from "../../../configs/routes";
import { googleReportService } from "../../../services/Google/GoogleReportService";

export class AdminSendMessageAllScenes {
  messageService: SendMessageServices;

  constructor(instanceBot: any) {
    this.messageService = new SendMessageServices(instanceBot);
  }

  handle() {
    return new Scenes.WizardScene<any>(
      SCENE_ADMIN_SEND_MESSAGE_ALL,
      // step 1
      async (ctx) => {
        await ctx.replyWithHTML(`👨‍💼 <b>Режим рассылки</b>

Напишите любое сообщение и отправьте его — оно будет разослано всем пользователям.`);
        return ctx.wizard.next();
      },
      // step 2
      async (ctx) => {
        if (!ctx.message || !ctx.message.text) {
          await ctx.reply("Пожалуйста, введите текстовое сообщение.");
          return;
        }

        const isReset = await sceneReset(ctx, ctx.message.text);
        if (isReset) return null;

        // Сохраняем текст сообщения
        ctx.wizard.state.messageId = ctx.message.message_id;
        ctx.wizard.state.chatId = ctx.chat.id;

        // Отправляем предпросмотр с кнопкой
        await ctx.replyWithHTML(
          `⚠️ <b>Будьте внимательны</b> — отменить рассылку будет невозможно`,

          createInlineKeyboard([
            { label: "✅ Отправить", action: "send_mailing" },
            { label: "❌ Отменить", action: "cancel_mailing" },
          ]),
        );
        // Переходим к финальному шагу для обработки callback
        return ctx.wizard.next();
      },

      // Шаг 3: Обработка действий с кнопками
      async (ctx) => {
        // Проверяем, что это callback-запрос
        if (ctx.callbackQuery) {
          await ctx.answerCbQuery();

          if (ctx.callbackQuery.data === "send_mailing") {
            ctx.replyWithHTML("⏳ Загружаем информацию из таблицы...");

            try {
              const listUsers = await googleReportService.getAllUserId();

              await this.messageService.sendAllMessage(
                listUsers.slice(950),
                ctx.wizard.state.messageId,
                ctx?.from?.id,
                ctx.wizard.state.chatId,
              );
            } catch (e) {
              await ctx.replyWithHTML(
                "🚫 Ошибка при отправке!",
                createInlineKeyboard([
                  {
                    label: "Создать сообщение заново",
                    action: ADMIN_SEND_MESSAGE_ALL_ROUTE,
                  },
                ]),
              );
            }

            // Выходим из сцены
            return ctx.scene.leave();
          } else if (ctx.callbackQuery.data === "cancel_mailing") {
            await ctx.editMessageText("❌ Рассылка отменена");
            return ctx.scene.leave();
          }
        }
        // Если это не callback, ждем нажатия кнопки
        return;
      },
    );
  }
}
