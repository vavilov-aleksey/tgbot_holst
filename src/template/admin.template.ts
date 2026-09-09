import Handlebars from "handlebars";

export const startSendMessageTemplate = Handlebars.compile(`
👨‍💼 <b>Режим рассылки конкретному пользователю</b>

Введите id пользователя:
`);

export const startAddGiftTemplate = Handlebars.compile(`
🎁 <b>Добавление подарка</b>

Введите количество холстов для подарка:
• Только цифры
• Без пробелов и символов
`);

export const startAddCertificateTemplate = Handlebars.compile(`
📝 <b>Добавление сертификата</b>

Выберите тип сертификата:
`);

export const checkAddedGiftTemplate = Handlebars.compile<{
  countPhoto: number;
}>(`
🎁 Количество холстов: <b>{{countPhoto}} шт.</b>

Для подтверждения нажмите <b>"Сохранить"</b>
`);

export const loaderAddedGiftTemplate = Handlebars.compile(
  `Сохраняем сертификат...`,
);

export const successGiftPhotoTemplate = Handlebars.compile<{
  countPhoto: number;
  uniqId: string;
}>(`
✨ <b>Сертификат сохранен!</b>

🔢 Номер сертификата: <code>{{uniqId}}</code>
📸 Количество холстов: {{countPhoto}}
`);

export const successGiftDeliveryTemplate = Handlebars.compile<{
  uniqId: string;
}>(`
✨ <b>Сертификат сохранен!</b>

🔢 Номер сертификата: <code>{{uniqId}}</code>
🚚 Доставка бесплатно
`);

export const successGiftCertificateTemplate = Handlebars.compile<{
  countPhoto: number;
  uniqId: string;
}>(`
✨ <b>Сертификат сохранен!</b>

🔢 Номер сертификата: <code>{{uniqId}}</code>
📸 Количество холстов: {{countPhoto}}
🚚 Доставка бесплатно
`);
