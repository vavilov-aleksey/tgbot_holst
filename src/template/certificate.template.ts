import Handlebars from "handlebars";

export const certificatePriceTemplate = Handlebars.compile<{
  countPhoto: number;
  price: number;
  phone: string;
}>(`
🧾 <b>Ваш заказ:</b>

📱 <b>Телефон:</b> {{phone}}
🎁 <b>Сертификат:</b> {{countPhoto}} холст с доставкой
💸 <b>Сумма к оплате:</b> {{price}} ₽

Если всё верно, нажмите <b>"Оплатить заказ"</b>, чтобы перейти к оплате.

📄 После успешной оплаты вы мгновенно получите электронный сертификат.
`);

export const certificateSuccessTemplate = Handlebars.compile<{
  countPhoto: string;
  numberCertificate: string;
}>(`
🎉 <b>Оплата прошла успешно!</b>

🎁 <b>Сертификат:</b> {{countPhoto}} + доставка

🔢 <b>Номер сертификата:</b> <code>{{numberCertificate}}</code>

Сохраните этот номер — он понадобится при оформлении заказа.

Благодарим за покупку! Желаем ярких моментов 📸
`);

export const certificateAlreadyUsedTemplate = Handlebars.compile<{
  numberCertificate: string;
}>(`
❌ <b>Сертификат уже использован</b>

Сертификат <b>{{numberCertificate}}</b> уже был активирован ранее.

Если вы считаете, что это ошибка, пожалуйста:

• Обратитесь в поддержку
• Или попробуйте другой сертификат

Без активного сертификата вы можете продолжить оформление обычного заказа.
`);

export const loaderSearchCertificateTemplate = Handlebars.compile(`
<tg-emoji emoji-id="5231012545799666522">🔍</tg-emoji> <b>Проверяем сертификат...</b>
`);

export const loaderCreateCertificateTemplate = Handlebars.compile(`
<tg-emoji emoji-id="5386367538735104399">⌛</tg-emoji> <b>Формируем заказ...</b>
`);
