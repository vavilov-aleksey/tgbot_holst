import { Scenes } from "telegraf";
import { sceneReset } from "../commands/sceneReset";
import { createInlineKeyboard } from "../../utils";
import { useSessionInfo } from "../../hooks";
import { yaDiskService } from "../../services/YandexDisk";
import { TBotContext } from "../../app/types";
import { DOMAIN_TG_SUPPORT } from "../../app/constants/constants.support";
import { useGlobalState } from "../../hooks/useGlobalState";
import { confirmAndPay } from "../commands/payment/confirmAndPay";
import {
  yandexDiskErrorMinOrderTemplate,
  yandexDiskErrorTemplate,
  yandexDiskSuccessTemplate,
  yandexDiskUploadLinkTemplate,
} from "../../template/yandexDisk.template";
import { loaderCreateOrder } from "../../template/sucessPayment";

// Функция для проверки, является ли текст ссылкой
function validateLink(text: string) {
  const urlPattern =
    /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  return urlPattern.test(text);
}

const sendErrorMessage = async (ctx: TBotContext, textLink?: string) => {
  await ctx.replyWithHTML(
    yandexDiskErrorTemplate({}),
    createInlineKeyboard([
      {
        label: "Поддержка",
        action: `tg://resolve?domain=${DOMAIN_TG_SUPPORT}&text=Проблема с загрузкой ссылки на Яндекс.Диск.\n\nМоя ссылка: ${textLink}`,
        type: "url",
      },
    ]),
  );
};

const sendErrorMessageMinOrder = async (
  ctx: TBotContext,
  minCountOrder: number,
) => {
  await ctx.replyWithHTML(
    yandexDiskErrorMinOrderTemplate({
      minOrder: minCountOrder,
    }),
  );
};

const sendSuccessMessage = async (ctx: TBotContext, count: number) => {
  const { setGlobalState } = useGlobalState(ctx);

  const message = await ctx.replyWithHTML(
    yandexDiskSuccessTemplate({
      count,
    }),
    createInlineKeyboard([
      { label: "🚀 Оформить заказ", action: "Оформить заказ" },
    ]),
  );

  setGlobalState({ messageIdPaymentLink: message?.message_id });
};

export class UploadYandexDiskScenes {
  constructor(private bot: any) {}

  handle() {
    const yaDiskScenes = new Scenes.BaseScene<TBotContext>("uploadYandexDisk");

    yaDiskScenes.enter(async (ctx) => {
      await ctx.replyWithHTML(yandexDiskUploadLinkTemplate({}));
    });

    // вынести в хелпер переиспользуемый
    yaDiskScenes.action("Оформить заказ", async (ctx) => {
      const { deletePaymentLink } = useGlobalState(ctx);

      await deletePaymentLink();

      const message = await ctx.replyWithHTML(loaderCreateOrder({}));

      await confirmAndPay(ctx);
      try {
        await ctx.deleteMessage(message.message_id);
      } catch (e) {
        console.log(
          "❌ Не удалось удалить сообщение в savePhotoScenes 98: ",
          e,
        );
      }
      await ctx.scene.leave();
    });

    yaDiskScenes.on("text", async (ctx) => {
      const linkText = ctx.message.text;

      const isReset = await sceneReset(ctx, linkText);

      if (isReset) return null;

      const clearText = linkText.trim();
      const isValidLink = validateLink(clearText);

      if (isValidLink) {
        const { getPublicResourceFiles } = yaDiskService();

        await getPublicResourceFiles(clearText).then((result) => {
          if (result?.error) {
            sendErrorMessage(ctx, clearText);
            return null;
          }

          const count = result?.count ?? 0;

          const { getMinCountOrder } = useSessionInfo(ctx);
          const minCountOrder = getMinCountOrder();

          if (count < minCountOrder) {
            sendErrorMessageMinOrder(ctx, minCountOrder);
            return null;
          } else {
            const { setPhotoInfo } = useSessionInfo(ctx);

            setPhotoInfo({
              count,
              pathDisk: clearText,
            });

            sendSuccessMessage(ctx, count);
          }
        });
      } else {
        await sendErrorMessage(ctx, clearText);
      }
    });

    yaDiskScenes.on("message", async (ctx) => {
      await sendErrorMessage(ctx);
    });

    return yaDiskScenes;
  }
}
