import Handlebars from "handlebars";

export const selectedPaymentMethodTemplate = Handlebars.compile(`
<tg-emoji emoji-id="5427168083074628963">💎</tg-emoji> <b>Есть бонусный код?</b>

Есть сертификат, промокод или подарок — <b>введите его номер ниже</b>.  
Если нет — выберите «Пропустить»
`);

export const selectedPaymentMethodErrorTemplate = Handlebars.compile<{
  certificateNumber?: string;
}>(`
<tg-emoji emoji-id="5210952531676504517">❌</tg-emoji> <b>Сертификат {{certificateNumber}} не найден</b>

Похоже, введен неверный номер сертификата или он не существует.

🔍 <b>Проверьте:</b>
• Правильность номера (без пробелов и лишних символов)

Попробуйте ввести номер еще раз или свяжитесь с поддержкой.
`);

export const selectedPaymentMethodSuccessCertificateTemplate =
  Handlebars.compile<{
    count: string;
  }>(`
<tg-emoji emoji-id="5206607081334906820">✅</tg-emoji> <b>Сертификат подтвержден!</b>

🎁 <b>Ваш номинал:</b> {{count}} с бесплатной доставкой

📌 <b>Важная информация:</b>

➕ Вы можете загрузить <b>больше изображений</b> — оплатите только разницу в количестве

➖ Если загрузите <b>меньше изображений</b> — остаток сгорит, сертификат нельзя разделить
`);

export const selectedPaymentMethodSuccessFreeDeliveryTemplate =
  Handlebars.compile(`
<tg-emoji emoji-id="5206607081334906820">✅</tg-emoji> <b>Сертификат подтвержден!</b>

🎁 <b>Ваш номинал:</b> бесплатная доставка
`);

export const selectedPaymentMethodSuccessFreePhotoTemplate =
  Handlebars.compile<{
    count: string;
  }>(`
<tg-emoji emoji-id="5206607081334906820">✅</tg-emoji> <b>Сертификат подтвержден!</b>

🎁 <b>Ваш номинал:</b> {{count}} в подарок
`);

export const selectedPaymentMethodSuccessBonusPerValueTemplate =
  Handlebars.compile<{
    count: string;
  }>(`
<tg-emoji emoji-id="5206607081334906820">✅</tg-emoji> <b>Сертификат подтвержден!</b>

🎁 <b>Ваш номинал:</b> {{count}} в подарок за каждые 10 холстов
`);
