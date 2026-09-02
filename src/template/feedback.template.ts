import Handlebars from "handlebars";

export const feedbackStartTemplate = Handlebars.compile(`
<tg-emoji emoji-id="5424818078833715060">📣</tg-emoji> <b>Помогите нам стать лучше!</b>

Расскажите о вашем опыте использования нашего бота:
• Что понравилось?
• Что можно улучшить?
• Возникли ли сложности?

📝 <b>Принимаем только текстовые сообщения</b>
(аудио, видео и другие файлы пока не поддерживаются)

💬 Введите ваш отзыв в поле ниже и отправьте его как обычное сообщение.

Ваше мнение очень ценно для нас и поможет сделать сервис удобнее для всех! ✨
`);

export const feedbackSuccessTemplate = Handlebars.compile(`
<tg-emoji emoji-id="5337080053119336309">💖</tg-emoji> <b>Спасибо за ваш отзыв!</b>

Мы ценим, что вы нашли время поделиться мнением.  
Ваши замечания помогут нам сделать сервис еще лучше.

Хорошего дня и ярких холстов! 📸
`);

export const feedbackCheckMessageTemplate = Handlebars.compile<{
  messageText: string;
}>(`
<tg-emoji emoji-id="5395444784611480792">✏️</tg-emoji> <b>Ваш отзыв готов к отправке:</b>

<blockquote>{{messageText}}</blockquote>
`);

export const loaderFeedbackSaveMessageTemplate = Handlebars.compile(`
<tg-emoji emoji-id="5386367538735104399">⌛</tg-emoji> <b>Сохраняем отзыв...</b>

<blockquote>{{messageText}}</blockquote>
`);
