import { TBotContext } from "../../../app/types";
import { useSessionInfo } from "../../../hooks";
import { IS_DEVELOPMENT_MODE } from "../../../app/constants/constants.settings";
import { createPrintCdek } from "./createPrintCdek";

export const createPrintDelivery = async (ctx: TBotContext) => {
  const { getPochtaOrderNumber } = useSessionInfo(ctx);

  // только для прода
  if (IS_DEVELOPMENT_MODE) return;

  const pochtaOrderNumber = getPochtaOrderNumber();
  if (pochtaOrderNumber) {
    await createPrintCdek(ctx, pochtaOrderNumber);
  }
};
