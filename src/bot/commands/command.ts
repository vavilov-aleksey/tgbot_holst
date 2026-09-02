import { Telegraf } from "telegraf";
import { TBotContext } from "../../app/types";

export abstract class Command {
  protected constructor(
    public bot: Telegraf<TBotContext>,
    public instanceBot?: any,
  ) {}

  abstract handle(): void;
}
