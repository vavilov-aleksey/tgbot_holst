import { CERTIFICATE_ROUTE, STATUS_ROUTE } from "./routes";
import { configFaq } from "./configFaq";

export const config = {
  myCommands: [
    {
      command: "start",
      description: "Перезапустить бота",
    },
    {
      command: CERTIFICATE_ROUTE,
      description: "Купить сертификат",
    },
    {
      command: "faq",
      description: "Вопросы",
    },
    {
      command: STATUS_ROUTE,
      description: "Узнать статус заказа",
    },
    {
      command: "feedback",
      description: "Обратная связь",
    },
  ],

  ...configFaq,
};
