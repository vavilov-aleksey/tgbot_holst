import Handlebars from "handlebars";

type StartTemplateProps = {
  pricePrintWithBorder: number;
  pricePrintWithoutBorder: number;
  minOrder: number;
  priceDelivery: number;
  urlOfferta: string;
};

export const startTemplate = Handlebars.compile<StartTemplateProps>(`
<tg-emoji emoji-id="5440431182602842059">👋</tg-emoji> <b>Добро пожаловать в наш бот печати на холсте!</b>  

Мы печатаем ваши фото на качественном холсте в формате <b>40×50 см</b>.

У нас есть два варианта оформления:
🖼 <b>С рамкой (с полями для багета)</b> — изображение печатается с дополнительными белыми полями по краям (технический запас). Это позволяет легко натянуть холст на подрамник или вставить в багетную раму, не теряя значимых деталей снимка {{pricePrintWithBorder}} рублей.
📐 <b>Без рамки</b> — печать точно по размеру 40×50 см, без технологических полей по краям {{pricePrintWithoutBorder}} рублей.

Минимальный заказ — от <b>{{minOrder}} холста</b>. 🛒

🚚 Доставка СДЕК по всей России за {{priceDelivery}} рублей.

<i>Используя наш сервис, вы соглашаетесь с <a href="{{urlOfferta}}">условиями пользовательского соглашения</a></i>

Готовы начать? Тогда выбирайте изображения и оформляйте заказ! 😊
`);
