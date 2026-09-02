export const getTimeStamp = () =>
  new Date().toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
  });
