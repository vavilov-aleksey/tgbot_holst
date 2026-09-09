import Handlebars from "handlebars";

export const statusNotFoundTemplate = Handlebars.compile(`
🔍 <b>Заказ не найден</b>

Не удалось найти активный заказ по вашим данным.

Возможные причины:
• Заказ был оформлен более 30 дней назад

📞 Для уточнения информации свяжитесь с поддержкой
`);

export const statusInProgressTemplate = Handlebars.compile(`
<tg-emoji emoji-id="5319161050128459957">👨‍💻</tg-emoji> <b>Ваш заказ находится в работе</b>

📦 Статус: <b>Холсты печатаются</b>
📅 Ожидаемая готовность: в течение 5-7 рабочих дней
`);

export const statusAlreadyReadyTemplate = Handlebars.compile(`
🚚 <b>Ваш заказ отправлен!</b>

📦 Статус: <b>Передан в службу доставки</b>

Обычная доставка занимает 3-7 дней в зависимости от региона.

Желаем приятного получения заказа! 📸
`);
