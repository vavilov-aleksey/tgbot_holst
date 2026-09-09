import Handlebars from "handlebars";

type StartTemplateProps = {
  pricePrintSmall: number;
  pricePrintBig: number;
  minOrder: string;
  priceDelivery: number;
  urlOfferta: string;
};

export const startTemplate = Handlebars.compile<StartTemplateProps>(`
<tg-emoji emoji-id="5397890811436213746">🤍</tg-emoji> <b>Добро пожаловать в наш бот печати на холсте!</b>  

Мы печатаем изображения на профессиональном матовом холсте ✨

Вы можете выбрать один из двух размеров:
🌌 40×50 см — {{pricePrintSmall}} рублей 
🌄 50×70 см — {{pricePrintBig}} рублей

Минимальный заказ — от <b>{{minOrder}}</b>. 🛒

💌 Доставка СДЕК по всей России за 249 рублей

<i>Используя наш сервис, вы соглашаетесь с <a href="{{urlOfferta}}">условиями пользовательского соглашения</a></i>

Готовы начать? Тогда выбирайте изображения и оформляйте заказ! 😊
`);
