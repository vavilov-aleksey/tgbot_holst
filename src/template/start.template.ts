import Handlebars from "handlebars";

type StartTemplateProps = {
  pricePrintSmall: number;
  pricePrintBig: number;
  minOrder: string;
  priceDelivery: number;
  urlOfferta: string;
};

export const startTemplate = Handlebars.compile<StartTemplateProps>(`
<tg-emoji emoji-id="5440431182602842059">👋</tg-emoji> <b>Добро пожаловать в наш бот печати на холсте!</b>  

Мы печатаем изображения на качественном холсте.

Вы можете выбрать один из двух размеров:
📐 <b>40×50 см</b> — {{pricePrintSmall}} рублей.
📐 <b>50×70 см</b> — {{pricePrintBig}} рублей.

Минимальный заказ — от <b>{{minOrder}}</b>. 🛒

🚚 Доставка СДЕК по всей России за {{priceDelivery}} рублей.

<i>Используя наш сервис, вы соглашаетесь с <a href="{{urlOfferta}}">условиями пользовательского соглашения</a></i>

Готовы начать? Тогда выбирайте изображения и оформляйте заказ! 😊
`);
