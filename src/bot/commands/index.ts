import { StartCommand } from "./start";
import { ShowImportantInfoCommand } from "./showImportantInfo";
import { FormatCommands } from "./format";
import { FaqCommands } from "./faq";
import { CheckDeliveryInfoCommand } from "./checkDeliveryInfo";
import { SelectPrintTypeCommand } from "./selectPrintType";
import { SelectedUpload } from "./selectedUpload";
import { PaymentCommands } from "./payment/paymentCommands";
import { AdminCommands } from "./admin/adminCommands";
import { CertificateCommand } from "./certificate";
import { FeedbackCommand } from "./feedback";
import { StatusCommand } from "./status";
import { TestingCommand } from "./testing";
import { Telegraf } from "telegraf";
import { TBotContext } from "../../app/types";

export const commandsProvider = (bot: Telegraf<TBotContext>, thisBot: any) => [
  new StartCommand(bot),
  new ShowImportantInfoCommand(bot),
  new FormatCommands(bot),
  new FaqCommands(bot),
  new CheckDeliveryInfoCommand(bot),
  new SelectPrintTypeCommand(bot),
  new SelectedUpload(bot),
  new PaymentCommands(bot, thisBot),
  new AdminCommands(bot, thisBot),
  new CertificateCommand(bot, thisBot),
  new FeedbackCommand(bot),
  new StatusCommand(bot),
  // для тестирования
  new TestingCommand(bot),
];
