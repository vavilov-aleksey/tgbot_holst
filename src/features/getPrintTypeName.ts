import {
  PRICE_PRINT_TYPE_WITH_BORDER,
  PRICE_PRINT_TYPE_WITHOUT_BORDER,
} from "../app/constants/constants.price";
import { TContextPrintType } from "../app/types";

export const getPrintTypeName: Record<TContextPrintType, string> = {
  [PRICE_PRINT_TYPE_WITH_BORDER]: "с рамкой",
  [PRICE_PRINT_TYPE_WITHOUT_BORDER]: "без рамки",
};

export const getPrintTypeNameForYandexDisk: Record<TContextPrintType, string> =
  {
    [PRICE_PRINT_TYPE_WITH_BORDER]: "рам",
    [PRICE_PRINT_TYPE_WITHOUT_BORDER]: "9p",
  };
