import { GetEnvKey } from "../../features/getEnvKey";

export const TRACKING_CDEK_SHIPMENT_POINT = String(
  new GetEnvKey().get("CDEK_SHIPMENT_POINT"),
);

export const TRACKING_CDEK_TARIFF_CODE = String(
  new GetEnvKey().get("CDEK_TARIFF_CODE"),
);

export const TRACKING_CDEK_INDEX_URL = String(
  new GetEnvKey().get("CDEK_INDEX_URL"),
);

export const TRACKING_CDEK_TRACKING_URL = String(
  new GetEnvKey().get("CDEK_TRACKING_URL"),
);
