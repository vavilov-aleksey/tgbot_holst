import { Command } from "./command";
import { Telegraf } from "telegraf";
import { TBotContext } from "../../app/types";
import {
  CERTIFICATE_ROUTE,
  CREATE_ORDER_CERTIFICATE_ROUTE,
  START_ROUTE,
} from "../../configs/routes";
import fs from "fs";
import { createInlineKeyboard } from "../../utils";
import {
  CERTIFICATE_1,
  CERTIFICATE_3,
  CERTIFICATE_5,
  CERTIFICATE_CONFIG,
} from "../../app/constants/constants.certificate";
import { useSessionInfo } from "../../hooks";
import { v4 as uuidv4 } from "uuid";
import { certificateSuccessTemplate } from "../../template/certificate.template";
import { createJpegFileForCertificate } from "../../utils/createJpegFileForCertificate";
import { SCENE_CERTIFICATE } from "../../app/constants/constants.scene";
import { googleCertificateService } from "../../services/Google/GoogleCertificateService";
import {
  saveReportGoogle,
  successStatusPayment,
} from "./payment/statusPayment";
import { getCurrentDateMoscow } from "../../utils/getCurrentDate";
import { CertificateEnum } from "../../app/types/certificateType";
import { orderInProgressTemplate } from "../../template/orderInProgress.template";
import { consoleLogWithTime } from "../../utils/consoleLogWithTime";

export const handleCertificateAction = async (ctx: TBotContext) => {
  const { setCertificate, certificateInfo, isGlobalLoading } =
    useSessionInfo(ctx);

  if (isGlobalLoading) {
    await ctx.replyWithHTML(orderInProgressTemplate({}));
    consoleLogWithTime(`🕐 Заказ в обработке`, ctx);
    return;
  }

  if (certificateInfo?.messageId) {
    try {
      await ctx.deleteMessage(certificateInfo?.messageId);
    } catch (error) {}

    setCertificate(null);
  }

  await ctx.replyWithPhoto(
    {
      source: fs.createReadStream("./assets/certificate_start_photo.jpg"),
    },
    {
      caption: `🎁 <b>Подарочный сертификат на холст с доставкой</b>

Выберите номинал:
• ${CERTIFICATE_CONFIG[CERTIFICATE_1].count} холст + доставка — <b>${CERTIFICATE_CONFIG[CERTIFICATE_1].price} ₽</b>
• ${CERTIFICATE_CONFIG[CERTIFICATE_3].count} холста + доставка — <b>${CERTIFICATE_CONFIG[CERTIFICATE_3].price} ₽</b> 
• ${CERTIFICATE_CONFIG[CERTIFICATE_5].count} холстов + доставка — <b>${CERTIFICATE_CONFIG[CERTIFICATE_5].price} ₽</b>

💫 <i>Идеальный подарок для близких!</i>`,
      parse_mode: "HTML",
      ...createInlineKeyboard([
        {
          action: CERTIFICATE_1,
          label: `${CERTIFICATE_CONFIG[CERTIFICATE_1].count} холст - ${CERTIFICATE_CONFIG[CERTIFICATE_1].price} ₽`,
        },
        {
          action: CERTIFICATE_3,
          label: `${CERTIFICATE_CONFIG[CERTIFICATE_3].count} холста - ${CERTIFICATE_CONFIG[CERTIFICATE_3].price} ₽`,
        },
        {
          action: CERTIFICATE_5,
          label: `${CERTIFICATE_CONFIG[CERTIFICATE_5].count} холстов - ${CERTIFICATE_CONFIG[CERTIFICATE_5].price} ₽`,
        },
      ]),
    },
  );
};

export const handleCertificateSuccessPayment = async (
  ctx: TBotContext,
  info: {
    amount: number;
    date: string;
    orderId: string;
  },
) => {
  try {
    const { certificateInfo, setCertificate, getReferrerLink } =
      useSessionInfo(ctx);
    const uniqId = uuidv4().substring(0, 8);

    const { photoBuffer, onDeleteFileStream } =
      await createJpegFileForCertificate(uniqId, certificateInfo?.count!);

    if (certificateInfo?.messageId) {
      await ctx.deleteMessage(certificateInfo?.messageId);
    }

    await ctx.replyWithPhoto(
      {
        source: photoBuffer,
      },
      {
        caption: certificateSuccessTemplate({
          countPhoto: certificateInfo?.count!,
          numberCertificate: uniqId,
        }),
        parse_mode: "HTML",
        ...createInlineKeyboard([
          {
            label: "Вернуться к оформлению",
            action: START_ROUTE,
          },
        ]),
      },
    );

    await onDeleteFileStream();

    await googleCertificateService.addCertificate({
      countPhoto: certificateInfo?.count!,
      certificateNumber: uniqId,
      type: CertificateEnum.certificate,
      price: info.amount,
      phone: certificateInfo?.phone!,
      date: info.date,
      orderId: info.orderId,
      userId: ctx.from?.id!,
      referrerLink: getReferrerLink()!,
    });

    setCertificate(null);
  } catch (e) {
    console.log("Error in certificate", JSON.stringify(e));
  }
};

export class CertificateCommand extends Command {
  constructor(bot: Telegraf<TBotContext>, instanceBot: any) {
    super(bot, instanceBot);
  }

  handle() {
    this.bot.command(CERTIFICATE_ROUTE, async (ctx) => {
      await handleCertificateAction(ctx);
    });

    this.bot.action(CERTIFICATE_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      await handleCertificateAction(ctx);
    });

    // переменные из env
    this.bot.action(
      [CERTIFICATE_1, CERTIFICATE_3, CERTIFICATE_5],
      async (ctx) => {
        await ctx.answerCbQuery();
        const { setCertificate } = useSessionInfo(ctx);

        //@ts-ignore
        const type = ctx?.update?.callback_query?.data;

        // @ts-ignore
        const certInfo = CERTIFICATE_CONFIG[type];

        await ctx.scene.enter(SCENE_CERTIFICATE);

        setCertificate({ count: certInfo.count, price: certInfo.price });
      },
    );

    // если заказ по сертификату
    this.bot.action(CREATE_ORDER_CERTIFICATE_ROUTE, async (ctx) => {
      await ctx.answerCbQuery();
      const { getOrderInfo } = useSessionInfo(ctx);

      const certificateRowGoogle = getOrderInfo()?.certificate?.rowInGoogle!;

      await successStatusPayment(ctx, 0, getCurrentDateMoscow());

      await saveReportGoogle(ctx, {
        amount: 0,
        date: getCurrentDateMoscow(),
        orderId: "ЗАКАЗ ПО СЕРТИФИКАТУ",
      });

      await googleCertificateService.setCertificateDateUsage(
        certificateRowGoogle,
      );
    });
  }
}
