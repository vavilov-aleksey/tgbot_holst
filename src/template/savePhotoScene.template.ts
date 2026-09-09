import Handlebars from "handlebars";

export const savePhotoSceneTemplate = Handlebars.compile<{
  minCountOrder: number;
}>(`
<tg-emoji emoji-id="5443127283898405358">📥</tg-emoji> <b>Загрузите изображения для печати</b>

Чтобы добавить изображение, просто отправьте его в чат одним из способов:
🔹 <b>Как файл</b> — нажмите на значок 📎 (скрепка) в чате и выберите «Файл», затем укажите изображение с вашего устройства. Это <b>предпочтительный способ</b> — так мы получаем изображение в исходном качестве без сжатия.

⚠️ <b>Важно!</b> Не отправляйте изображение как обычное изображение (через галерею) — Telegram сильно сжимает такие файлы, и качество печати может пострадать.

Мы обработаем каждое изображение и <b>сообщим вам, когда все они будут готовы</b> к оформлению заказа.

❗ <b>Минимальный заказ:</b> {{minCountOrder}} холста.
`);

export const finalSavePhotoSceneTemplate = Handlebars.compile<{
  photoCount: number;
}>(`
<tg-emoji emoji-id="5424972470023104089">🔥</tg-emoji> <b>Супер! Уже {{photoCount}} изображений</b>

➕ <b>Загружайте ещё изображения</b> — не ограничивайте себя!
Мы обработаем их и сообщим о готовности.

❗️<b>Обязательно дождитесь загрузки всех загруженных файлов</b> перед оформлением заказа!

🎯 Или переходите к оформлению, если достаточно
`);

export const minCountSavePhotoSceneTemplate = Handlebars.compile<{
  minCount: number;
  currentCount: number;
  difference: number;
}>(`
<tg-emoji emoji-id="5260293700088511294">⛔️</tg-emoji> <b>Загружено {{currentCount}} из {{minCount}} изображений</b>.

Минимальный заказ составляет <b>{{minCount}} изображение</b>.  

❗ Осталось загрузить: <b>{{difference}} изображение</b>
`);

export const errorFormatPhotoTemplate = Handlebars.compile(`
<tg-emoji emoji-id="5210952531676504517">❌</tg-emoji> Пожалуйста, загрузите именно файл(документ)

Нажмите на скрепку 📎 и выберите "Файл" или "Документ"
`);
