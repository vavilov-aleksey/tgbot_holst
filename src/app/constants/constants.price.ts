import { GetEnvKey } from "../../features/getEnvKey";

export const PRICE_PRINT_TYPE_WITH_BORDER = Number(
  new GetEnvKey().get("PRICE_PRINT_TYPE_WITH_BORDER"),
);
export const PRICE_PRINT_TYPE_WITHOUT_BORDER = Number(
  new GetEnvKey().get("PRICE_PRINT_TYPE_WITHOUT_BORDER"),
);
export const PRICE_DELIVERY_POCHTA = Number(
  new GetEnvKey().get("PRICE_DELIVERY"),
);
