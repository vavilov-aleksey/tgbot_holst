import { GetEnvKey } from "../../features/getEnvKey";

export const MIN_COUNT_ORDER = Number(new GetEnvKey().get("MIN_COUNT_ORDER"));
export const WEIGHT_HOLST_SMALL = Number(
  new GetEnvKey().get("WEIGHT_HOLST_SMALL"),
);
export const WEIGHT_HOLST_BIG = Number(new GetEnvKey().get("WEIGHT_HOLST_BIG"));

export const WEIGHT_PACKAGE_SMALL = Number(
  new GetEnvKey().get("WEIGHT_PACKAGE_SMALL"),
);
export const WEIGHT_PACKAGE_BIG = Number(
  new GetEnvKey().get("WEIGHT_PACKAGE_BIG"),
);
