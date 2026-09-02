import { getTimeStamp } from "./getTimeStamp";
import { TBotContext } from "../app/types";

export const consoleErrorWithTime = (log: string, ctx: TBotContext) => {
  console.error(
    `${log}, timestamp: ${getTimeStamp()}, userId: ${ctx?.from?.id}`,
  );
};
