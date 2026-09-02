import { Scenes } from "telegraf";
import { SCENE_ADMIN_ADD_GIFT } from "../../../app/constants/constants.scene";
import { createInlineKeyboard } from "../../../utils";
import { ADMIN_ADD_GIFT_ROUTE } from "../../../configs/routes";
import { sceneReset } from "../../commands/sceneReset";
import { googleCertificateService } from "../../../services/Google/GoogleCertificateService";
import { v4 as uuidv4 } from "uuid";
import { getCurrentDateMoscow } from "../../../utils/getCurrentDate";
import { CertificateEnum } from "../../../app/types/certificateType";
import {
  checkAddedGiftTemplate,
  loaderAddedGiftTemplate,
  startAddGiftTemplate,
  successGiftDeliveryTemplate,
  successGiftPhotoTemplate,
} from "../../../template/admin.template";

const keyboardAddGift = createInlineKeyboard([
  {
    label: "Добавить ещё один подарок",
    action: ADMIN_ADD_GIFT_ROUTE,
  },
]);

export class AdminAddGiftScenes {
  handle() {
    return new Scenes.WizardScene<any>(
      SCENE_ADMIN_ADD_GIFT,
      // step 1
      async (ctx) => {
        // Отправляем предпросмотр с кнопкой
        await ctx.replyWithHTML(
          `Какой подарок хотите добавить?`,

          createInlineKeyboard([
            { label: "📷 Фото в подарок", action: "photo_free" },
            { label: "🚚 Доставка в подарок", action: "delivery_free" },
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

          if (ctx.callbackQuery.data === "delivery_free") {
            const message = await ctx.replyWithHTML(
              loaderAddedGiftTemplate({}),
            );
            const uniqId = uuidv4().substring(0, 8);
            try {
              await googleCertificateService.addCertificate({
                countPhoto: 0,
                type: CertificateEnum.freeDelivery,
                certificateNumber: uniqId,
                price: 0,
                phone: "",
                date: getCurrentDateMoscow(),
                orderId: "Добавлен администратором",
                userId: ctx.from?.id!,
                referrerLink: "",
              });

              await ctx.deleteMessage(message.message_id);

              await ctx.replyWithHTML(
                successGiftDeliveryTemplate({ uniqId }),
                keyboardAddGift,
              );
            } catch (e) {
              await ctx.replyWithHTML(
                "🚫 Ошибка при сохранении!",
                keyboardAddGift,
              );
            }

            // Выходим из сцены
            return ctx.scene.leave();
          } else if (ctx.callbackQuery.data === "photo_free") {
            await ctx.replyWithHTML(startAddGiftTemplate({}));

            return ctx.wizard.next();
          }
        }

        const isReset = await sceneReset(ctx, ctx.message.text);
        if (isReset) return null;

        return;
      },
      // step 2
      async (ctx) => {
        if (!ctx.message || !ctx.message.text) {
          await ctx.reply("Введите количество фото для подарка.");
          return;
        }

        const isReset = await sceneReset(ctx, ctx.message.text);
        if (isReset) return null;

        // Сохраняем текст сообщения
        ctx.wizard.state.countPhotoGift = ctx.message.text;

        // Отправляем предпросмотр с кнопкой
        await ctx.replyWithHTML(
          checkAddedGiftTemplate({ countPhoto: ctx.message.text }),

          createInlineKeyboard([
            { label: "✅ Сохранить", action: "send_mailing" },
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
            const message = await ctx.replyWithHTML(
              loaderAddedGiftTemplate({}),
            );

            const uniqId = uuidv4().substring(0, 8);
            try {
              await googleCertificateService.addCertificate({
                countPhoto: ctx.wizard.state.countPhotoGift,
                type: CertificateEnum.freeGift,
                certificateNumber: uniqId,
                price: 0,
                phone: "",
                date: getCurrentDateMoscow(),
                orderId: "Добавлен администратором",
                userId: ctx.from?.id!,
                referrerLink: "",
              });

              await ctx.deleteMessage(message.message_id);

              await ctx.replyWithHTML(
                successGiftPhotoTemplate({
                  countPhoto: ctx.wizard.state.countPhotoGift,
                  uniqId,
                }),
                keyboardAddGift,
              );
            } catch (e) {
              await ctx.replyWithHTML(
                "🚫 Ошибка при сохранении!",
                keyboardAddGift,
              );
            }

            // Выходим из сцены
            return ctx.scene.leave();
          } else if (ctx.callbackQuery.data === "cancel_mailing") {
            await ctx.editMessageText("❌ Фото на подарок не сохранено");
            return ctx.scene.leave();
          }
        }
        // Если это не callback, ждем нажатия кнопки
        return;
      },
    );
  }
}
