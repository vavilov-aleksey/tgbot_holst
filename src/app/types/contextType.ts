import {
  PRICE_PRINT_TYPE_BIG,
  PRICE_PRINT_TYPE_SMALL,
} from "../constants/constants.price";
import { Context, Scenes } from "telegraf";
import { CertificateEnum } from "./certificateType";

export enum DeliveryTypeEnum {
  "pochta" = "pochta",
  "cdek" = "cdek",
  "post5" = "5post",
}

export type TContextDeliveryInfo = {
  userName: string;
  phone: string;
  index?: string;
  address?: string;
  region?: string;
  city?: string;
  type: DeliveryTypeEnum;
  // почта росии
  idPvz?: string;
  cityCodePvz?: number;
};

export type TContextPrintType =
  | typeof PRICE_PRINT_TYPE_SMALL
  | typeof PRICE_PRINT_TYPE_BIG;

export type PaymentInfoType = {
  orderId: string;
  sum: number;
  paymentDate: string;
};

export type TContextSession = {
  user: {
    deliveryInfo: Partial<TContextDeliveryInfo>;
    // printType: TContextPrintType | undefined;
    // pathDisk: string | undefined;
    // photosId: Array<string>; // храним только id фото
    // photosCount: number; // если загружали фото через яндекс.диск
    paymentInfo: PaymentInfoType | null;
    trackNumber: string | null;
    pochtaOrderNumber: string | null; // переименовать. нужен как для почты так и для сдека. может вообще вынести отдельно
    minCountOrder: number;

    photosInfo: {
      // храним только id фото
      listId: Array<string>;
      // если загружали фото через яндекс.диск
      count: number;
      // Тип 40*50 or 50*70
      type?: TContextPrintType;
      // ссылка на яндекс.диск
      pathDisk?: string;
    };

    orderInfo: Partial<{
      method: "card" | "certificate";
      certificate: {
        type: CertificateEnum;
        count: number;
        number: string; // номер сертификата из таблицы
        rowInGoogle: number;
      } | null;
    }> | null;
  };
  isGlobalLoading: boolean;
  // продажа сертификата со своим стейтом
  certificate: Partial<{
    phone: string;
    messageId: number;
    count: number;
    price: number;
  }> | null;
  globalState: {
    errorUploadPhotosOutsideScene: boolean;
    messageIdPaymentLink: number | null;
  };
  referrerLink: string | null;
};

export type TBotContext = Context & {
  session: TContextSession & Scenes.SceneSession<Scenes.SceneSessionData>;
  scene: Scenes.SceneContextScene<TBotContext>;
  startPayload: string;
  persistSession?: () => Promise<void>;
};
