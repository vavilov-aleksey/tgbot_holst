import { TBotContext } from "../app/types";
import { CertificateEnum } from "../app/types/certificateType";
import { useSessionInfo } from "./useSession";
import { PRICE_DELIVERY_POCHTA } from "../app/constants/constants.price";

export const useOrderResult = (
  ctx: TBotContext,
): {
  numberOfPhoto: number;
  totalPricePhoto: number;
  totalPriceWithDelivery: number;
  freePhoto?: number | undefined;
} => {
  const { getPhotoInfo, getOrderInfo } = useSessionInfo(ctx);

  const typeCertificate = getOrderInfo()?.certificate?.type;

  const typePhoto = getPhotoInfo()?.type!;
  const countPhoto = getPhotoInfo()?.count!;
  const freePhoto = getOrderInfo()?.certificate?.count!;

  if (typeCertificate === CertificateEnum.certificate) {
    const resultCountCalc = () => {
      if (countPhoto > getOrderInfo()?.certificate?.count!) {
        return countPhoto - getOrderInfo()?.certificate?.count!;
      } else {
        return 0;
      }
    };

    return {
      numberOfPhoto: countPhoto,
      totalPricePhoto: typePhoto * resultCountCalc(),
      totalPriceWithDelivery: typePhoto * resultCountCalc(),
    };
  }

  if (typeCertificate === CertificateEnum.freeDelivery) {
    return {
      numberOfPhoto: countPhoto,
      totalPricePhoto: typePhoto * countPhoto,
      totalPriceWithDelivery: typePhoto * countPhoto,
    };
  }

  if (typeCertificate === CertificateEnum.freeGift) {
    const certificateCount = getOrderInfo()?.certificate?.count!;

    const resultCountCalculation =
      countPhoto > certificateCount ? countPhoto - certificateCount : 0;

    return {
      numberOfPhoto: countPhoto,
      totalPricePhoto: typePhoto * resultCountCalculation,
      totalPriceWithDelivery:
        typePhoto * resultCountCalculation + PRICE_DELIVERY_POCHTA,
      freePhoto: Number(freePhoto) || undefined,
    };
  }

  if (typeCertificate === CertificateEnum.bonusPerValue) {
    const countBonus = Math.floor(countPhoto / 110) * freePhoto;

    const resultCountCalculation =
      countPhoto >= 110 ? countPhoto - countBonus : countPhoto;

    return {
      numberOfPhoto: countPhoto,
      totalPricePhoto: typePhoto * resultCountCalculation,
      totalPriceWithDelivery:
        typePhoto * resultCountCalculation + PRICE_DELIVERY_POCHTA,
      freePhoto: countBonus,
    };
  }

  // по умолчанию расчет для оплаты картой
  return {
    numberOfPhoto: countPhoto,
    totalPricePhoto: typePhoto * countPhoto,
    totalPriceWithDelivery: typePhoto * countPhoto + PRICE_DELIVERY_POCHTA,
  };
};
