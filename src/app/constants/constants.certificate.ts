import { GetEnvKey } from "../../features/getEnvKey";

export const CERTIFICATE_NAME = "certificate";

// названия из env
export const CERTIFICATE_100 = "CERTIFICATE_100";
export const CERTIFICATE_300 = "CERTIFICATE_300";
export const CERTIFICATE_500 = "CERTIFICATE_500";

export const CERTIFICATE_CONFIG = {
  CERTIFICATE_100: {
    count: 100,
    price: Number(new GetEnvKey().get(CERTIFICATE_100)),
  },
  CERTIFICATE_300: {
    count: 300,
    price: Number(new GetEnvKey().get(CERTIFICATE_300)),
  },
  CERTIFICATE_500: {
    count: 500,
    price: Number(new GetEnvKey().get(CERTIFICATE_500)),
  },
};
