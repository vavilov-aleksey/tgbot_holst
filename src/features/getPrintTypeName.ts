import {
  PRICE_PRINT_TYPE_BIG,
  PRICE_PRINT_TYPE_SMALL,
} from "../app/constants/constants.price";
import { TContextPrintType } from "../app/types";

export const getPrintTypeName: Record<TContextPrintType, string> = {
  [PRICE_PRINT_TYPE_SMALL]: "40*50",
  [PRICE_PRINT_TYPE_BIG]: "50*70",
};

export const getPrintTypeNameForYandexDisk: Record<TContextPrintType, string> =
  {
    [PRICE_PRINT_TYPE_SMALL]: "40*50",
    [PRICE_PRINT_TYPE_BIG]: "50*70",
  };
