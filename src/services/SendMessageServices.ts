import { START_ROUTE } from "../configs/routes";

export class SendMessageServices {
  constructor(private instanceBot: any) {}

  async sendMessage(userId: string, message: string) {
    try {
      await this.instanceBot.bot.telegram.sendMessage(userId, message);
    } catch (e: any) {
      console.error("Сообщение пользователю отправить не удалось: ", {
        userId,
        message,
        description: e?.response?.description,
      });
      throw new Error("Error sending message");
    }
  }

  async sendAllMessage(
    listUsers: string[],
    message: string,
    currentUserId: string,
    chatId: string,
  ) {
    await this.instanceBot.bot.telegram.sendMessage(
      currentUserId,
      "📤 Рассылка запущена...",
    );

    const progressMessage = await this.instanceBot.bot.telegram.sendMessage(
      currentUserId,
      `📊 Прогресс: 0/${listUsers.length}`,
    );

    let counter = 0;
    for (let user of listUsers) {
      try {
        await this.instanceBot.bot.telegram.copyMessage(user, chatId, message, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Оформить заказ",
                  callback_data: START_ROUTE,
                },
              ],
            ],
          },
        });

        await this.instanceBot.bot.telegram.editMessageText(
          currentUserId,
          progressMessage.message_id,
          undefined,
          `📊 Прогресс: ${counter + 1}/${listUsers.length}`,
        );
        counter++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (e) {
        //@ts-ignore
        if (e?.response?.error_code === 429) {
          // @ts-ignore
          const retryAfter = e?.response?.parameters?.retry_after ?? 5;
          console.log(
            `🚦 Превышен лимит запросов. Ожидание ${retryAfter} секунд...`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter * 1000),
          );

          try {
            await this.instanceBot.bot.telegram.copyMessage(
              user,
              chatId,
              message,
              {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "Оформить заказ",
                        callback_data: START_ROUTE,
                      },
                    ],
                  ],
                },
              },
            );
          } catch (retryError) {
            console.error(
              `Не удалось отправить сообщение userId: ${user} после повторной попытки`,
              retryError,
            );
          }
        } else {
          console.error(`Не удалось отправить сообщение userId: ${user}`, e);
        }
      }
    }

    await this.instanceBot.bot.telegram.sendMessage(
      currentUserId,
      "📤 Рассылка завершена...",
    );
  }
}
