import { TRACKING_CDEK_TRACKING_URL } from "../app/constants/constants.tracking";
import Handlebars from "handlebars";

export const successOrderCdek = Handlebars.compile<{
  trackNumber: string;
}>(`
📦 <b>Ваш заказ сформирован!</b>

Вот трек-номер для отслеживания посылки:
<b><code>{{trackNumber}}</code></b>

Мы готовим ваш заказ к отправке. Как только передадим его в «СДЭК», вы сможете отслеживать статус доставки:
👉 Сайт <a href="${TRACKING_CDEK_TRACKING_URL}">СДЭК</a>
👇 Перейдя по ссылке ниже

Статус трек-номера может обновиться <b>не ранее чем через 1 день</b> после передачи заказа — СДЭК обрабатывает отправления не мгновенно.

Спасибо, что выбрали наш сервис! Надеемся, напечатанные фото будут радовать вас долгое время 📸

Если возникнут вопросы – мы всегда на связи. Приятного дня! 😊`);

export const loaderCreateOrder = Handlebars.compile(`
<tg-emoji emoji-id="5386367538735104399">⌛</tg-emoji> Оформляем заказ...`);
