import { Scenes } from "telegraf";
import { SCENE_ADMIN_GET_PHOTOS_COUNT } from "../../../app/constants/constants.scene";
import { ADMIN_GET_PHOTOS_COUNT_ROUTE } from "../../../configs/routes";
import { sceneReset } from "../../commands/sceneReset";
import { TBotContext } from "../../../app/types";
import { googleFindNumberOfPhotosService } from "../../../services/Google/GoogleFindNumberOfPhotosService";
import { createInlineKeyboard } from "../../../utils";

const findNumberOfPhotos = async (ctx: TBotContext, dateStr: string) => {
  const totalPhotos =
    await googleFindNumberOfPhotosService.getPhotosCountByDate(dateStr);

  await ctx.replyWithHTML(
    `Дата: ${dateStr}, Количество фото: ${totalPhotos}`,
    createInlineKeyboard([
      {
        label: "Выбрать другую дату",
        action: ADMIN_GET_PHOTOS_COUNT_ROUTE,
      },
    ]),
  );
};

export class AdminGetPhotosCountByDateScenes {
  handle() {
    return new Scenes.WizardScene<any>(
      SCENE_ADMIN_GET_PHOTOS_COUNT,
      // step 1
      async (ctx) => {
        // Отправляем предпросмотр с кнопкой
        await ctx.replyWithHTML(`Введите дату в формате 05.08.2026`);
        // Переходим к финальному шагу для обработки callback
        return ctx.wizard.next();
      },

      // step 2
      async (ctx) => {
        const isReset = await sceneReset(ctx, ctx?.message?.text);
        if (isReset) return null;

        const dateStr = ctx?.message?.text;

        findNumberOfPhotos(ctx, dateStr).catch((e) => {
          console.log("Ошибка в adminFindNumberOfPhotos: ", e);
        });
        // Переходим к финальному шагу для обработки callback
        return ctx.wizard.next();
      },

      // Шаг 4: Обработка действий с кнопками
      async (ctx) => {
        const isReset = await sceneReset(ctx, ctx?.message?.text);
        if (isReset) return null;

        // Проверяем, что это callback-запрос
        if (ctx.callbackQuery) {
          await ctx.answerCbQuery();

          if (ctx.callbackQuery.data === ADMIN_GET_PHOTOS_COUNT_ROUTE) {
            return ctx.scene.enter(SCENE_ADMIN_GET_PHOTOS_COUNT);
          }
        }
        // Если это не callback, ждем нажатия кнопки
        return;
      },
    );
  }
}
