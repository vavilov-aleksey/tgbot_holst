import Handlebars from "handlebars";

export const orderInProgressTemplate = Handlebars.compile(`
📦 <b>Заказ в обработке</b>

В настоящее время система занята обработкой вашего текущего заказа.

Пожалуйста, попробуйте создать новый заказ позже.
`);
