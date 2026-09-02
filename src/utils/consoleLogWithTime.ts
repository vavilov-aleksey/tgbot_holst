import { getTimeStamp } from "./getTimeStamp";
import { TBotContext } from "../app/types";

export const consoleLogWithTime = (log: string, ctx: TBotContext) => {
  console.log(`${log}, timestamp: ${getTimeStamp()}, userId: ${ctx?.from?.id}`);
};
