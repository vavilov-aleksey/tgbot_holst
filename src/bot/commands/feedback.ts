import { Command } from "./command";
import { Telegraf } from "telegraf";
import { TBotContext } from "../../app/types";
import { FEEDBACK_ROUTE } from "../../configs/routes";
import { SCENE_FEEDBACK } from "../../app/constants/constants.scene";

export const handleFeedbackAction = async (ctx: TBotContext) => {
  await ctx.scene.enter(SCENE_FEEDBACK);
};

export class FeedbackCommand extends Command {
  constructor(bot: Telegraf<TBotContext>) {
    super(bot);
  }

  handle() {
    this.bot.command(FEEDBACK_ROUTE, async (ctx: TBotContext) => {
      await handleFeedbackAction(ctx);
    });

    this.bot.action(FEEDBACK_ROUTE, async (ctx: TBotContext) => {
      await ctx.answerCbQuery();
      await handleFeedbackAction(ctx);
    });
  }
}
