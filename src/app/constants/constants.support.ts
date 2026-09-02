import { GetEnvKey } from "../../features/getEnvKey";

export const SUPPORT_TG_SUPPORT = String(new GetEnvKey().get("TG_SUPPORT"));
export const DOMAIN_TG_SUPPORT = String(new GetEnvKey().get("DOMAIN_SUPPORT"));
