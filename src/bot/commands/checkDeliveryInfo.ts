import { Command } from "./command";
import { Telegraf } from "telegraf";
import {
  CHECK_DELIVERY_INFO_ROUTE,
  EDIT_ALL_USER_INFO,
  SELECT_UPLOAD_ROUTE,
} from "../../configs/routes";
import { useSessionInfo } from "../../hooks";
import {
  TBotContext,
  TContextPrintType,
  TContextSession,
} from "../../app/types";
import { getPrintTypeName } from "../../features/getPrintTypeName";
import { CertificateEnum } from "../../app/types/certificateType";
import { editMessageText } from "../../features/editMessageText";

const giftText = (info: TContextSession["user"]["orderInfo"]) => {
  const certificate = info?.certificate;

  if (certificate?.type === CertificateEnum.certificate) {
    return `Подарочный сертификат на ${certificate.count} фото`;
  }

  if (certificate?.type === CertificateEnum.freeGift) {
    return `${certificate.count} фото в подарок`;
  }

  if (certificate?.type === CertificateEnum.freeDelivery) {
    return `Доставка в подарок`;
  }

  if (certificate?.type === CertificateEnum.bonusPerValue) {
    return `${certificate.count} фото в подарок за каждые 100 фото`;
  }

  return null;
};

export const showCheckDeliveryInfo = async (ctx: TBotContext) => {
  const { getDeliveryInfo, getPhotoInfo, getOrderInfo } = useSessionInfo(ctx);
  const deliveryInfo = getDeliveryInfo();
  const printType = getPhotoInfo()?.type!;

  await editMessageText(ctx, {
    message: `<tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji> <b>Проверьте ваши данные для доставки:</b>

📸 <b>Тип холста:</b> ${getPrintTypeName[printType as TContextPrintType]} - ${printType} рублей за холст
📮 <b>СДЕК ID:</b> ${deliveryInfo?.idPvz}
🏣 <b>Адрес СДЕК:</b> ${deliveryInfo?.address}
👤 <b>ФИО получателя:</b> ${deliveryInfo?.userName}
📞 <b>Номер телефона:</b> ${deliveryInfo?.phone}
${getOrderInfo()?.method === "certificate" ? `<b>🎁 Бонус:</b> ${giftText(getOrderInfo())}` : ""}

Если всё верно, нажмите <b>"Подтвердить"</b>.  
Если нужно что-то исправить, нажмите <b>"Изменить данные"</b>. 😊`,
    keyboard: [
      {
        label: "Подтвердить ✅",
        action: SELECT_UPLOAD_ROUTE,
      },
      {
        label: "Изменить все данные ✏️",
        action: EDIT_ALL_USER_INFO,
      },
    ],
  });
};

export class CheckDeliveryInfoCommand extends Command {
  constructor(bot: Telegraf<TBotContext>) {
    super(bot);
  }

  handle() {
    this.bot.action(CHECK_DELIVERY_INFO_ROUTE, (ctx) =>
      showCheckDeliveryInfo(ctx),
    );
  }
}
