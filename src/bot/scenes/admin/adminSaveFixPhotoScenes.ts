import { Scenes } from "telegraf";
import { SCENE_ADMIN_SAVE_FIX_PHOTO } from "../../../app/constants/constants.scene";
import { createInlineKeyboard } from "../../../utils";
import { ADMIN_SAVE_FIX_PHOTO_ROUTE } from "../../../configs/routes";
import { sceneReset } from "../../commands/sceneReset";
import { getMockContext } from "../../../features/getMockContext";
import { createFolderOnlyFixPhoto } from "../../../features/createFolderForUserInfo";
import { TBotContext } from "../../../app/types";
import { yaDiskService } from "../../../services/YandexDisk";

export class AdminSaveFixPhotoScenes {
  instanceBot: any;

  constructor(instanceBot: any) {
    this.instanceBot = instanceBot;
  }

  handle() {
    return new Scenes.WizardScene<any>(
      SCENE_ADMIN_SAVE_FIX_PHOTO,
      // step 1
      async (ctx) => {
        await ctx.replyWithHTML(`
👨‍💼 <b>Режим восстановления фото конкретному пользователю</b>

Введите id пользователя и путь до папки.

Пример:
328252246
/TGBOT/Август 2026/23_08_2026/7 988 898-89-89 9p (Оплачен TG_BOT)
`);
        return ctx.wizard.next();
      },

      // step 2
      async (ctx) => {
        if (!ctx.message || !ctx.message.text) {
          await ctx.reply(
            "Пожалуйста, введите userId пользователя и путь до папки.",
          );
          return;
        }

        const isReset = await sceneReset(ctx, ctx.message.text);
        if (isReset) return null;

        const splitText = ctx.message.text.split("\n");
        const userId = splitText[0];
        const nameFolder = splitText[1];

        // Сохраняем текст сообщения
        ctx.wizard.state.userId = userId;
        ctx.wizard.state.nameFolder = nameFolder;

        const { checkCreatePath } = yaDiskService();
        // проверяем, что на яндекс диске есть папка
        const hasFolder = await checkCreatePath<boolean>(nameFolder);

        if (!hasFolder) {
          await ctx.replyWithHTML(
            "❌ Нет такой папки",
            createInlineKeyboard([
              {
                label: "Восстановить другую",
                action: ADMIN_SAVE_FIX_PHOTO_ROUTE,
              },
            ]),
          );
          return;
        }

        const userContext = await getMockContext(this.instanceBot, userId);

        const photosInfo = userContext?.session?.user?.photosInfo;

        const lengthPhoto = !!photosInfo?.count
          ? photosInfo.count
          : (photosInfo?.listId?.length ?? 0);
        // Отправляем предпросмотр с кнопкой
        await ctx.replyWithHTML(
          `📋 Фото для восстановления: ${lengthPhoto}`,

          createInlineKeyboard([
            { label: "✅ Восстановить", action: "send_mailing" },
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
              const mockContext = await getMockContext(
                this.instanceBot,
                ctx.wizard.state.userId,
              );
              await ctx.replyWithHTML("Восстановление...");

              await createFolderOnlyFixPhoto(
                mockContext as TBotContext,
                ctx.wizard.state.nameFolder,
              );
              await ctx.replyWithHTML(
                `✅ Фото восстановлены для ${ctx.wizard.state.userId}`,
                createInlineKeyboard([
                  {
                    label: "Восстановить ещё",
                    action: ADMIN_SAVE_FIX_PHOTO_ROUTE,
                  },
                ]),
              );
            } catch (e) {
              await ctx.replyWithHTML(
                "🚫 Ошибка при восстановлении!",
                createInlineKeyboard([
                  {
                    label: "Восстановить ещё",
                    action: ADMIN_SAVE_FIX_PHOTO_ROUTE,
                  },
                ]),
              );
            }

            // Выходим из сцены
            return ctx.scene.leave();
          } else if (ctx.callbackQuery.data === "cancel_mailing") {
            await ctx.editMessageText("❌ Восстановление отменено");
            return ctx.scene.leave();
          }
        }
        // Если это не callback, ждем нажатия кнопки
        return;
      },
    );
  }
}
