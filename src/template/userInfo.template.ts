import Handlebars from "handlebars";

export const userNameTemplate = Handlebars.compile(`
<tg-emoji emoji-id="5395444784611480792">✏️</tg-emoji> <b>Укажите ФИО получателя:</b>

Пожалуйста, введите фамилию, имя и отчество полностью, как указано в паспорте. 📝

Пример: <code>Иванов Иван Иванович</code>
`);

export const userNameErrorTemplate = Handlebars.compile(`
<tg-emoji emoji-id="5210952531676504517">❌</tg-emoji> <b>Ошибка ввода ФИО!</b>  

Пожалуйста, введите фамилию, имя и отчество <b>полностью</b>, как указано в паспорте.  
Пример: <code>Иванов Иван Иванович</code>  

Попробуйте ещё раз. 😊
`);

export const phoneEnterTemplate = Handlebars.compile(`
<tg-emoji emoji-id="5395444784611480792">✏️</tg-emoji> <b>Укажите номер телефона:</b>

Номер телефона нужен для связи с вами.  
Пожалуйста, введите номер в формате:  
<code>8XXXXXXXXXX</code>  

Пример: <code>89123456789</code>
`);

export const phoneEnterErrorTemplate = Handlebars.compile(`
<tg-emoji emoji-id="5210952531676504517">❌</tg-emoji> <b>Ошибка ввода номера телефона!</b>  

Пожалуйста, введите номер в формате:  
<code>8XXXXXXXXXX</code>  
Пример: <code>89123456789</code>  

Попробуйте ещё раз. 😊
`);
