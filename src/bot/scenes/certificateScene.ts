import { Scenes } from "telegraf";
import { CERTIFICATE_ROUTE } from "../../configs/routes";
import { useSessionInfo } from "../../hooks";
import { sceneReset } from "../commands/sceneReset";
import { TBotContext } from "../../app/types";
import { createInlineKeyboard, validatePhoneNumber } from "../../utils";
import { SCENE_CERTIFICATE } from "../../app/constants/constants.scene";
import { paymentService } from "../../services/paymentService";
import {
  certificatePriceTemplate,
  loaderCreateCertificateTemplate,
} from "../../template/certificate.template";
import {
  phoneEnterErrorTemplate,
  phoneEnterTemplate,
} from "../../template/userInfo.template";

const showErrorMessage = async (ctx: TBotContext) => {
  return await ctx.replyWithHTML(phoneEnterErrorTemplate({}));
};

const deleteErrorMessage = async (ctx: TBotContext, messageId: number) => {
  try {
    if (messageId) {
      await ctx.deleteMessage(messageId);
    }
  } catch (e) {}
};

// todo дублирется логика для ввода номер телефона. переделать.
export class CertificateScene {
  handle() {
    const phoneScenes = new Scenes.BaseScene<TBotContext>(SCENE_CERTIFICATE);

    let messageError: any = null;

    phoneScenes.enter(async (ctx) => {
      await ctx.replyWithHTML(phoneEnterTemplate({}));
    });

    phoneScenes.on("text", async (ctx: TBotContext) => {
      // @ts-ignore
      const phoneText = ctx.message.text;

      const clearText = phoneText.trim();
      const isValidPhone = validatePhoneNumber(clearText);

      const isReset = await sceneReset(ctx, clearText);

      if (isReset) return null;

      if (!isValidPhone) {
        try {
          await deleteErrorMessage(ctx, messageError?.message_id);
          await ctx.deleteMessage();
        } catch (e) {}

        messageError = await showErrorMessage(ctx);
      } else {
        await deleteErrorMessage(ctx, messageError?.message_id);

        const { setCertificate } = useSessionInfo(ctx);

        setCertificate({ phone: clearText });

        await ctx.scene.leave();

        await this.confirm(ctx);
      }
    });

    phoneScenes.on("message", async (ctx) => {
      await deleteErrorMessage(ctx, messageError?.message_id);
      await showErrorMessage(ctx);
    });

    return phoneScenes;
  }

  private async confirm(ctx: TBotContext) {
    const { setCertificate, certificateInfo } = useSessionInfo(ctx);

    const price = certificateInfo?.price!;

    const loaderMessage = await ctx.replyWithHTML(
      loaderCreateCertificateTemplate({}),
    );

    try {
      const response = await paymentService.registerPaymentCert(ctx, price);

      if (response) {
        const message = await ctx.replyWithHTML(
          certificatePriceTemplate({
            countPhoto: certificateInfo?.count!,
            price: certificateInfo?.price!,
            phone: certificateInfo?.phone!,
          }),
          createInlineKeyboard([
            {
              action: response.formUrl,
              label: `Оплатить ${response.price} ₽`,
              type: "url",
            },
            {
              action: CERTIFICATE_ROUTE,
              label: "Вернуться к выбору сертификата",
            },
          ]),
        );

        setCertificate({
          messageId: message?.message_id,
          count: certificateInfo?.count!,
        });
      }
    } catch (e) {
    } finally {
      await deleteErrorMessage(ctx, loaderMessage.message_id);
    }
  }
}
