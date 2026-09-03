import {
  FAQ_DELIVERY_ROUTE,
  FAQ_EXAMPLE_ROUTE,
  FAQ_FORMAT_ROUTE,
  FAQ_MAKE_ON_ORDER_ROUTE,
  FAQ_PAY_ROUTE,
  FAQ_ROUTE,
  START_ROUTE,
  STATUS_ROUTE,
} from "./routes";
import { PRICE_DELIVERY } from "../app/constants/constants.price";
import { SUPPORT_TG_SUPPORT } from "../app/constants/constants.support";

const navigationStartRoute = {
  label: "Вернуться к оформлению",
  action: START_ROUTE,
};

const navigationBackRoute = {
  label: "Вернуться к вопросам",
  action: FAQ_ROUTE,
};

const navigationCommon = [navigationStartRoute, navigationBackRoute];

export const configFaq = {
  [FAQ_ROUTE]: {
    text: `Часто задаваемые вопросы:`,
    navigation: [
      { label: "Узнать статус заказа", action: STATUS_ROUTE },
      { label: "Как оплатить?", action: FAQ_PAY_ROUTE },
      { label: "Доставка", action: FAQ_DELIVERY_ROUTE },
      { label: "Формат", action: FAQ_FORMAT_ROUTE },
      {
        label: "Поддержка",
        action: SUPPORT_TG_SUPPORT,
        type: "url",
      },
      navigationStartRoute,
    ],
  },

  [FAQ_MAKE_ON_ORDER_ROUTE]: {
    text: "Как оформить заказ?",
    navigation: navigationCommon,
  },

  [FAQ_PAY_ROUTE]: {
    text: `<tg-emoji emoji-id="5231449120635370684">💸</tg-emoji> <b>Способы оплаты</b>

Мы принимаем оплату удобным для вас способом:

✅ <b>Картой любого банка</b>
✅ <b>Через СБП </b>

После успешной оплаты вы получите подтверждение, и мы сразу начнём обработку вашего заказа. 🚀`,
    navigation: navigationCommon,
  },

  [FAQ_DELIVERY_ROUTE]: {
    text: `<tg-emoji emoji-id="5413879192267805083">🗓</tg-emoji> <b>Доставка по всей России</b>

Мы отправляем ваши холсты <b>СДЭК</b>.

✅ <b>Стоимость доставки:</b> ${PRICE_DELIVERY} рублей.  
✅ <b>Срок доставки:</b> 3–7 дней (в зависимости от региона).  
✅ <b>Трек-номер:</b> пришлём после отправки, вместе со ссылкой для отслеживания.`,
    navigation: navigationCommon,
  },

  [FAQ_EXAMPLE_ROUTE]: {
    text: `Пример разных размеров`,
    navigation: navigationCommon,
  },

  [FAQ_FORMAT_ROUTE]: {
    text: "Как проверить формат?",
    navigation: navigationCommon,
  },
};
