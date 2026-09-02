import { Scenes } from "telegraf";
import { SCENE_ADMIN_SEND_MESSAGE } from "../../../app/constants/constants.scene";
import { createInlineKeyboard } from "../../../utils";
import { SendMessageServices } from "../../../services/SendMessageServices";
import { ADMIN_SEND_MESSAGE_ROUTE } from "../../../configs/routes";
import { startSendMessageTemplate } from "../../../template/admin.template";
import { sceneReset } from "../../commands/sceneReset";

export class AdminSendMessageScenes {
  messageService: SendMessageServices;

  constructor(instanceBot: any) {
    this.messageService = new SendMessageServices(instanceBot);
  }

  handle() {
    return new Scenes.WizardScene<any>(
      SCENE_ADMIN_SEND_MESSAGE,
      // step 1
      async (ctx) => {
        await ctx.replyWithHTML(startSendMessageTemplate({}));
        return ctx.wizard.next();
      },
      // step 2
      async (ctx) => {
        // Проверяем, что сообщение текстовое
        if (!ctx.message || !ctx.message.text) {
          await ctx.reply("Введите номер пользователя в текстовом формате.");
          return;
        }

        const isReset = await sceneReset(ctx, ctx.message.text);
        if (isReset) return null;

        ctx.wizard.state.userId = ctx.message.text;

        await ctx.reply("Введите сообщение для рассылки:");
        return ctx.wizard.next();
      },
      // step 3
      async (ctx) => {
        if (!ctx.message || !ctx.message.text) {
          await ctx.reply("Пожалуйста, введите текстовое сообщение.");
          return;
        }

        const isReset = await sceneReset(ctx, ctx.message.text);
        if (isReset) return null;

        // Сохраняем текст сообщения
        ctx.wizard.state.messageText = ctx.message.text;

        await ctx.deleteMessage();

        // Отправляем предпросмотр с кнопкой
        await ctx.replyWithHTML(
          `📋 Предпросмотр рассылки:

📝 Сообщение: 

${ctx.wizard.state.messageText}

⚠️ <b>Будьте внимательны</b> — отменить рассылку будет невозможно`,

          createInlineKeyboard([
            { label: "✅ Отправить", action: "send_mailing" },
            { label: "❌ Отменить", action: "cancel_mailing" },
          ]),
        );
        // Переходим к финальному шагу для обработки callback
        return ctx.wizard.next();
      },

      // Шаг 4: Обработка действий с кнопками
      async (ctx) => {
        // Проверяем, что это callback-запрос
        if (ctx.callbackQuery) {
          await ctx.answerCbQuery();

          if (ctx.callbackQuery.data === "send_mailing") {
            try {
              await this.messageService.sendMessage(
                ctx.wizard.state.userId,
                ctx.wizard.state.messageText,
              );

              await ctx.replyWithHTML(
                "✅ Рассылка отправлена",
                createInlineKeyboard([
                  {
                    label: "Создать ещё одно сообщение",
                    action: ADMIN_SEND_MESSAGE_ROUTE,
                  },
                ]),
              );
            } catch (e) {
              await ctx.replyWithHTML(
                "🚫 Ошибка при отправке!",
                createInlineKeyboard([
                  {
                    label: "Создать сообщение заново",
                    action: ADMIN_SEND_MESSAGE_ROUTE,
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
