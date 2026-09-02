import { Scenes } from "telegraf";
import { SCENE_FEEDBACK } from "../../app/constants/constants.scene";
import { START_ROUTE } from "../../configs/routes";
import { sceneReset } from "../commands/sceneReset";
import {
  feedbackCheckMessageTemplate,
  feedbackStartTemplate,
  feedbackSuccessTemplate,
  loaderFeedbackSaveMessageTemplate,
} from "../../template/feedback.template";
import { googleFeedbackService } from "../../services/Google/GoogleFeedbackService";
import { getCurrentDateMoscow } from "../../utils/getCurrentDate";
import { useSessionInfo } from "../../hooks";
import { editMessageText } from "../../features/editMessageText";

export class FeedbackScenes {
  handle() {
    let startMessage: any = null;

    return new Scenes.WizardScene<any>(
      SCENE_FEEDBACK,
      // step 1
      async (ctx) => {
        startMessage = await ctx.replyWithHTML(feedbackStartTemplate({}));
        return ctx.wizard.next();
      },

      // step2
      async (ctx) => {
        if (!ctx.message || !ctx.message.text) {
          await ctx.reply("Пожалуйста, введите текстовое сообщение.");
          return;
        }

        const isReset = await sceneReset(ctx, ctx.message.text);
        if (isReset) return null;

        // Сохраняем текст сообщения
        ctx.wizard.state.messageText = ctx.message.text;

        try {
          await ctx.deleteMessage();
          // удаляем стартовое сообщение
          await editMessageText(ctx, {
            message: feedbackCheckMessageTemplate({
              messageText: ctx.wizard.state.messageText,
            }),
            keyboard: [
              { label: "Отправить отзыв", action: "send_feedback_mailing" },
            ],
          });
        } catch (e) {}

        // удаляем стартовое сообщение
        try {
          await ctx.deleteMessage(startMessage?.message_id);
        } catch (e) {}

        // Переходим к финальному шагу для обработки callback
        return ctx.wizard.next();
      },

      // Шаг 4: Обработка действий с кнопками
      async (ctx) => {
        if (ctx?.message?.text) {
          const isReset = await sceneReset(ctx, ctx.message.text);
          if (isReset) return null;
        }
        // Проверяем, что это callback-запрос
        if (ctx.callbackQuery) {
          await ctx.answerCbQuery();

          if (ctx.callbackQuery.data === "send_feedback_mailing") {
            const { getReferrerLink } = useSessionInfo(ctx);

            const loaderMessage = await ctx.replyWithHTML(
              loaderFeedbackSaveMessageTemplate({}),
            );

            try {
              await googleFeedbackService.addFeedback({
                userId: ctx?.from?.id!,
                date: getCurrentDateMoscow(),
                referrerLink: getReferrerLink(),
                comment: ctx.wizard.state.messageText,
              });

              await editMessageText(ctx, {
                message: feedbackSuccessTemplate({}),
                keyboard: [
                  {
                    label: "Вернуться к оформлению",
                    action: START_ROUTE,
                  },
                ],
              });
            } catch (e) {
              await ctx.replyWithHTML(
                "Не удалось отправить отзыв, попробуйте позже",
              );
              console.log("Не удалось отправить отзыв: ", e);
            } finally {
              try {
                await ctx.deleteMessage(loaderMessage.message_id);
              } catch (e) {}
            }

            // Выходим из сцены
            return ctx.scene.leave();
          }
        }
        // Если это не callback, ждем нажатия кнопки
        return;
      },
    );
  }
}
