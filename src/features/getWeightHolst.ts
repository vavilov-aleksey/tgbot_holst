import { TContextPrintType } from "../app/types";
import {
  PRICE_PRINT_TYPE_BIG,
  PRICE_PRINT_TYPE_SMALL,
} from "../app/constants/constants.price";
import {
  WEIGHT_HOLST_BIG,
  WEIGHT_HOLST_SMALL,
  WEIGHT_PACKAGE_BIG,
  WEIGHT_PACKAGE_SMALL,
} from "../app/constants/constants.order";

const WEIGHT_PACKAGE = {
  [PRICE_PRINT_TYPE_SMALL]: WEIGHT_PACKAGE_SMALL,
  [PRICE_PRINT_TYPE_BIG]: WEIGHT_PACKAGE_BIG,
};

const WEIGHT_HOLST = {
  [PRICE_PRINT_TYPE_SMALL]: WEIGHT_HOLST_SMALL,
  [PRICE_PRINT_TYPE_BIG]: WEIGHT_HOLST_BIG,
};

export const getWeightHolst = (typePrint: TContextPrintType, count = 1) => {
  const weightPackage = WEIGHT_PACKAGE[typePrint];
  const weightPhoto = WEIGHT_HOLST[typePrint];

  return Math.max(1, Math.round(weightPhoto * count + weightPackage));
};
