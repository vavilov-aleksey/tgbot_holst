import { GetEnvKey } from "../../features/getEnvKey";

export const PRICE_PRINT_TYPE_SMALL = Number(
  new GetEnvKey().get("PRICE_PRINT_TYPE_SMALL"),
);
export const PRICE_PRINT_TYPE_BIG = Number(
  new GetEnvKey().get("PRICE_PRINT_TYPE_BIG"),
);
export const PRICE_DELIVERY = Number(new GetEnvKey().get("PRICE_DELIVERY"));
