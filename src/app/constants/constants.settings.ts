import { GetEnvKey } from "../../features/getEnvKey";

export const IS_DEVELOPMENT_MODE =
  String(new GetEnvKey().get("NODE_ENV")) === "development";

export const ADMIN_ID = new GetEnvKey().get("ADMIN_ID");
export const SUPER_ADMIN_ID = new GetEnvKey().get("SUPER_ADMIN_ID");
export const SUPPORT_ADMIN_ID = new GetEnvKey().get("SUPPORT_ADMIN_ID");
export const URL_OFFERTA = String(new GetEnvKey().get("URL_OFFERTA"));
