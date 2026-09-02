import { SUPER_ADMIN_ID } from "../app/constants/constants.settings";
import { TBotContext } from "../app/types";
import { getTimeStamp } from "../utils/getTimeStamp";

export class NotificationService {
  private bot: TBotContext;

  constructor(bot: TBotContext) {
    this.bot = bot;
  }

  // Отправка ошибки админу
  async sendError(error: Error, context?: any, userId?: number) {
    try {
      if (
        error.message.includes("bot was blocked by the user") ||
        (error as any).response?.error_code === 403
      ) {
        console.log(`Пользователь ${userId} заблокировал бота.`, error);
        return; // Просто выходим, не пытаемся отправлять сообщение
      }

      // Логируем полную информацию об ошибке
      console.error("=== ДЕТАЛИ ОШИБКИ ===");
      console.error("Сообщение:", error?.message);
      console.error("Стек:", error?.stack);

      // Если есть response от Telegram API
      const response = (error as any)?.response;
      if (response) {
        console.error("Response status:", response.status);
        console.error("Response data:", JSON.stringify(response.data, null, 2));
        console.error("Response headers:", response.headers);

        // Парсим детали ошибки
        if (response.data?.description) {
          console.error("Описание ошибки:", response.data.description);

          // Проверяем, содержит ли описание ошибки информацию о параметре
          const match = response.data.description.match(
            /BUTTON_URL_INVALID: (.*)/,
          );
          if (match) {
            console.error("Конкретная проблема с URL:", match[1]);
          }
        }
      }

      // Добавляем информацию о контексте
      if (context) {
        console.error("Контекст ошибки:", JSON.stringify(context, null, 2));
      }

      // Формируем детальное сообщение для админа
      const errorMessage = this.formatDetailedErrorMessage(
        error,
        context,
        userId,
      );

      // Отправляем админу
      await this.bot.telegram.sendMessage(SUPER_ADMIN_ID, errorMessage, {
        parse_mode: "HTML",
      });
    } catch (notificationError) {
      console.error(
        "Не удалось отправить уведомление об ошибке:",
        notificationError,
      );
    }
  }

  // Форматирование сообщения об ошибке
  private formatErrorMessage(
    error: Error,
    context?: any,
    userId?: number,
  ): string {
    let message = `🚨 <b>Ошибка в боте</b>\n\n`;
    message += `⏰ <b>Время:</b> ${getTimeStamp()}\n`;
    message += `📝 <b>Ошибка:</b> <code>${error.message}</code>\n`;

    if (userId) {
      message += `👤 <b>Пользователь:</b> ${userId}\n`;
    }

    return message;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private formatDetailedErrorMessage(
    error: Error,
    context?: any,
    userId?: number,
  ): string {
    let details = `<b>❌ Ошибка в боте</b>\n\n`;
    details += `<b>Сообщение:</b> ${this.escapeHtml(error.message)}\n`;

    const response = (error as any).response;
    if (response?.data?.description) {
      details += `<b>Описание Telegram:</b> ${this.escapeHtml(response.data.description)}\n`;

      // Парсим дополнительную информацию
      const description = response.data.description;
      if (description.includes("BUTTON_URL_INVALID")) {
        details += `\n<b>🔍 Проблема с URL кнопки:</b>\n`;

        // Извлекаем URL из описания ошибки, если он там есть
        const urlMatch = description.match(/URL: (https?:\/\/[^\s]+)/);
        if (urlMatch) {
          details += `URL: ${this.escapeHtml(urlMatch[1])}\n`;
        }

        const reasonMatch = description.match(/reason: ([^\n]+)/);
        if (reasonMatch) {
          details += `Причина: ${this.escapeHtml(reasonMatch[1])}\n`;
        }
      }
    }

    if (context) {
      details += `\n<b>📋 Контекст:</b>\n<code>${this.escapeHtml(JSON.stringify(context, null, 2))}</code>\n`;
    }

    if (userId) {
      details += `\n<b>👤 User ID:</b> ${userId}\n`;
    }

    details += `\n<b>🕐 Время:</b> ${new Date().toISOString()}\n`;

    if (process.env.NODE_ENV === "development") {
      details += `\n<b>📚 Стек:</b>\n<code>${this.escapeHtml(error.stack || "Нет стека")}</code>`;
    }

    return details;
  }

  // Отправка статистики
  async sendStats(stats: any) {
    try {
      const message =
        `📊 <b>Статистика бота</b>\n\n` +
        `👥 Пользователей: ${stats.totalUsers}\n` +
        `✅ Успешных операций: ${stats.success}\n` +
        `❌ Ошибок: ${stats.errors}\n` +
        `⏰ Аптайм: ${stats.uptime}`;

      await this.bot.telegram.sendMessage(SUPER_ADMIN_ID, message, {
        parse_mode: "HTML",
      });
    } catch (error) {
      console.error("Не удалось отправить статистику:", error);
    }
  }
}
