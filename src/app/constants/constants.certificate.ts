import { GetEnvKey } from "../../features/getEnvKey";

export const CERTIFICATE_NAME = "certificate";

// названия из env
export const CERTIFICATE_1 = "CERTIFICATE_1";
export const CERTIFICATE_3 = "CERTIFICATE_3";
export const CERTIFICATE_5 = "CERTIFICATE_5";

export const CERTIFICATE_CONFIG = {
  CERTIFICATE_1: {
    count: 1,
    price: Number(new GetEnvKey().get(CERTIFICATE_1)),
  },
  CERTIFICATE_3: {
    count: 3,
    price: Number(new GetEnvKey().get(CERTIFICATE_3)),
  },
  CERTIFICATE_5: {
    count: 5,
    price: Number(new GetEnvKey().get(CERTIFICATE_5)),
  },
};
