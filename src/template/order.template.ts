import Handlebars from "handlebars";

export const orderConfirmCardTemplate = Handlebars.compile<{
  photosCount: number;
  printType: number;
  printTypeName: string;
  pricePhoto: number;
  priceDelivery: number;
  totalPrice: number;
  giftCount?: number;
}>(`
🧾 <b>Ваш заказ:</b>

✅ <b>Количество фото:</b> {{photosCount}} шт.  
{{#if giftCount}}🎁 <b>В подарок:</b> {{giftCount}} шт.{{/if}}
✅ <b>Тип фото:</b> {{printTypeName}} - {{printType}} рублей за фото 
✅ <b>Стоимость фото:</b> {{pricePhoto}} рублей
✅ <b>Доставка:</b> {{priceDelivery}} рублей

💸 <b>Итоговая сумма:</b> {{totalPrice}} рублей

Если всё верно, нажмите <b>"Оплатить заказ"</b>, чтобы перейти к оплате.

❗️Ссылка для оплаты действительна в течение 10 минут.
`);

export const orderConfirmCertificateTemplate = Handlebars.compile<{
  photosCount: number;
  printTypeName: string;
}>(`
🧾 <b>Ваш заказ:</b>

✅ <b>Количество фото:</b> {{photosCount}} шт.  
✅ <b>Тип фото:</b> {{printTypeName}}
✅ <b>Сертификат:</b> покрывает весь заказ
✅ <b>Доставка:</b> бесплатно по сертификату

💸 <b>К оплате:</b> 0 рублей

Если всё верно, нажмите <b>"Подтвердить заказ"</b> для оформления.
`);

export const orderConfirmCertificateOverPriceTemplate = Handlebars.compile<{
  certificateCount: number;
  photosCount: number;
  printType: number;
  printTypeName: string;
  overCount: number;
  totalPrice: number;
}>(`
🧾 <b>Ваш заказ:</b>

✅ <b>Количество фото:</b> {{photosCount}} шт.  
✅ <b>Тип фото:</b> {{printTypeName}} - {{printType}} руб/фото
✅ <b>Сертификат:</b> покрывает {{certificateCount}} холст
✅ <b>Дополнительно:</b> {{overCount}} холст
✅ <b>Доставка:</b> бесплатно по сертификату

💸 <b>Доплата за {{overCount}} холст:</b> {{totalPrice}} рублей

Если всё верно, нажмите <b>"Оплатить заказ"</b>, чтобы перейти к оплате.

❗️Ссылка для оплаты действительна в течение 10 минут.
`);
