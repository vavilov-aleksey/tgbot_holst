import { Scenes } from "telegraf";
import { TBotContext } from "../../app/types";
import { SCENE_SELECTED_PAYMENT_TYPE } from "../../app/constants/constants.scene";
import { createInlineKeyboard } from "../../utils";
import {
  selectedPaymentMethodErrorTemplate,
  selectedPaymentMethodSuccessBonusPerValueTemplate,
  selectedPaymentMethodSuccessCertificateTemplate,
  selectedPaymentMethodSuccessFreeDeliveryTemplate,
  selectedPaymentMethodSuccessFreePhotoTemplate,
  selectedPaymentMethodTemplate,
} from "../../template/selectedPaymentMethod.template";
import { showCheckDeliveryInfo } from "../commands/checkDeliveryInfo";
import { useSessionInfo } from "../../hooks";
import { sceneReset } from "../commands/sceneReset";
import { googleCertificateService } from "../../services/Google/GoogleCertificateService";
import {
  certificateAlreadyUsedTemplate,
  loaderSearchCertificateTemplate,
} from "../../template/certificate.template";
import { CertificateEnum } from "../../app/types/certificateType";
import { pluralize } from "../../utils/pluralize";

export class SelectedPaymentTypeScenes {
  constructor() {}

  handle() {
    const scene = new Scenes.BaseScene<TBotContext>(
      SCENE_SELECTED_PAYMENT_TYPE,
    );

    scene.enter(async (ctx) => {
      await ctx.replyWithHTML(
        selectedPaymentMethodTemplate({}),
        createInlineKeyboard([
          {
            label: "Пропустить",
            action: "Продолжить без сертификата",
          },
        ]),
      );
    });

    scene.action("Продолжить без сертификата", async (ctx) => {
      const { setOrderInfo } = useSessionInfo(ctx);

      setOrderInfo({ method: "card", certificate: null });
      await showCheckDeliveryInfo(ctx);
      ctx.scene.leave();
    });
    scene.action("Продолжить с сертификатом", async (ctx) => {
      await showCheckDeliveryInfo(ctx);
      ctx.scene.leave();
    });

    scene.on("text", async (ctx) => {
      const certificateText = ctx.message.text?.trim();
      const isReset = await sceneReset(ctx, certificateText);

      if (isReset) return null;

      const { setOrderInfo } = useSessionInfo(ctx);

      if (certificateText) {
        const messageLoading = await ctx.replyWithHTML(
          loaderSearchCertificateTemplate({}),
        );

        const googleCert =
          await googleCertificateService.checkCertificate(certificateText);

        try {
          await ctx.deleteMessage(messageLoading?.message_id);
        } catch (e) {
          console.log("Не удалось удалить сообщение с загрузкой");
        }

        if (!googleCert) {
          await ctx.replyWithHTML(
            selectedPaymentMethodErrorTemplate({
              certificateNumber: certificateText,
            }),
          );
          try {
            await ctx.deleteMessage();
          } catch (e) {
            console.log("❌ Не удалось удалить сообщение в addressScenes: ", e);
          }
          return null;
        } else {
          // проверка сертификата
          if (googleCert?.alreadyUsed) {
            await alreadyUsed(ctx, certificateText);
            return null;
          }

          setOrderInfo({
            method: "certificate",
            certificate: {
              type: googleCert.type,
              rowInGoogle: googleCert.rowNumber,
              count: googleCert.quantity,
              number: googleCert.certificateNumber,
            },
          });

          const getHtmlForType = {
            [CertificateEnum.certificate]:
              selectedPaymentMethodSuccessCertificateTemplate({
                count: `${googleCert.quantity} ${pluralize(googleCert.quantity, "холст", "холста", "холстов")}`,
              }),
            [CertificateEnum.freeDelivery]:
              selectedPaymentMethodSuccessFreeDeliveryTemplate({}),
            [CertificateEnum.freeGift]:
              selectedPaymentMethodSuccessFreePhotoTemplate({
                count: `${googleCert.quantity} ${pluralize(googleCert.quantity, "холст", "холста", "холстов")}`,
              }),
            [CertificateEnum.bonusPerValue]:
              selectedPaymentMethodSuccessBonusPerValueTemplate({
                count: `${googleCert.quantity} ${pluralize(googleCert.quantity, "холст", "холста", "холстов")}`,
              }),
          };

          ctx.replyWithHTML(
            getHtmlForType[googleCert.type],
            createInlineKeyboard([
              {
                label: "Продолжить с сертификатом",
                action: "Продолжить с сертификатом",
              },
              {
                label: "Продолжить без сертификата",
                action: "Продолжить без сертификата",
              },
            ]),
          );
        }
      }
    });

    scene.on("message", (ctx) => {
      ctx.replyWithHTML(selectedPaymentMethodErrorTemplate({}));
    });

    return scene;
  }
}

const alreadyUsed = async (ctx: TBotContext, text: string) => {
  await ctx.replyWithHTML(
    certificateAlreadyUsedTemplate({
      numberCertificate: text,
    }),
    createInlineKeyboard([
      {
        label: "Продолжить без сертификата",
        action: "Продолжить без сертификата",
      },
    ]),
  );
  try {
    await ctx.deleteMessage();
  } catch (e) {
    console.log("❌ Не удалось удалить сообщение в addressScenes 74: ", e);
  }
};
