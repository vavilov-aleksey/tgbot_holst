import { TBotContext } from "../../app/types";
import { Command } from "./command";
import { Telegraf } from "telegraf";

export class TestingCommand extends Command {
  constructor(bot: Telegraf<TBotContext>) {
    super(bot);
  }

  handle() {
    this.bot.command("test", async (ctx) => {
      console.log("testing...");
    });
  }
}
