import { GetEnvKey } from "../../features/getEnvKey";

export const MIN_COUNT_ORDER = Number(new GetEnvKey().get("MIN_COUNT_ORDER"));
export const WEIGHT_PHOTO = Number(new GetEnvKey().get("WEIGHT_PHOTO"));
