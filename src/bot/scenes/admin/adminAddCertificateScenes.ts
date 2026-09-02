import { Scenes } from "telegraf";
import { SCENE_ADMIN_ADD_CERTIFICATE } from "../../../app/constants/constants.scene";
import { createInlineKeyboard } from "../../../utils";
import { ADMIN_ADD_CERTIFICATE_ROUTE } from "../../../configs/routes";
import {
  loaderAddedGiftTemplate,
  startAddCertificateTemplate,
  successGiftCertificateTemplate,
} from "../../../template/admin.template";
import { googleCertificateService } from "../../../services/Google/GoogleCertificateService";
import { v4 as uuidv4 } from "uuid";
import { getCurrentDateMoscow } from "../../../utils/getCurrentDate";
import {
  CERTIFICATE_100,
  CERTIFICATE_300,
  CERTIFICATE_500,
  CERTIFICATE_CONFIG,
} from "../../../app/constants/constants.certificate";
import { CertificateEnum } from "../../../app/types/certificateType";
import { sceneReset } from "../../commands/sceneReset";

const keyboardAddCertificate = createInlineKeyboard([
  {
    label: "Добавить ещё один сертификат",
    action: ADMIN_ADD_CERTIFICATE_ROUTE,
  },
]);

export class AdminAddCertificateScenes {
  handle() {
    return new Scenes.WizardScene<any>(
      SCENE_ADMIN_ADD_CERTIFICATE,
      // step 1
      async (ctx) => {
        await ctx.replyWithHTML(
          startAddCertificateTemplate({}),
          createInlineKeyboard([
            {
              action: CERTIFICATE_100,
              label: `${CERTIFICATE_CONFIG[CERTIFICATE_100].count} фото - ${CERTIFICATE_CONFIG[CERTIFICATE_100].price} ₽`,
            },
            {
              action: CERTIFICATE_300,
              label: `${CERTIFICATE_CONFIG[CERTIFICATE_300].count} фото - ${CERTIFICATE_CONFIG[CERTIFICATE_300].price} ₽`,
            },
            {
              action: CERTIFICATE_500,
              label: `${CERTIFICATE_CONFIG[CERTIFICATE_500].count} фото - ${CERTIFICATE_CONFIG[CERTIFICATE_500].price} ₽`,
            },
          ]),
        );
        return ctx.wizard.next();
      },
      // Шаг 2: Обработка действий с кнопками
      async (ctx) => {
        const isReset = await sceneReset(ctx, ctx?.message?.text);
        if (isReset) return null;

        // Проверяем, что это callback-запрос
        if (ctx.callbackQuery) {
          await ctx.answerCbQuery();

          if (
            [CERTIFICATE_100, CERTIFICATE_300, CERTIFICATE_500].includes(
              ctx.callbackQuery.data,
            )
          ) {
            const message = await ctx.replyWithHTML(
              loaderAddedGiftTemplate({}),
            );
            const uniqId = uuidv4().substring(0, 8);

            // @ts-ignore
            const countPhoto = CERTIFICATE_CONFIG[ctx.callbackQuery.data].count;

            try {
              await googleCertificateService.addCertificate({
                countPhoto: countPhoto,
                type: CertificateEnum.certificate,
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
                successGiftCertificateTemplate({ countPhoto, uniqId }),
                keyboardAddCertificate,
              );
            } catch (e) {
              await ctx.replyWithHTML(
                "🚫 Ошибка при сохранении!",
                keyboardAddCertificate,
              );
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
