/** Строка вида `DD.MM.YYYY`, например `12.05.2026`. */
export function getDateFromProps(dateStr: string) {
  const [dayRaw, monthRaw, yearRaw] = dateStr.split(".");
  const dayNum = Number(dayRaw);
  const monthNum = Number(monthRaw);
  const yearNum = Number(yearRaw);

  const d = new Date(yearNum, monthNum - 1, dayNum);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  const monthName = d
    .toLocaleString("ru-RU", { month: "long" })
    .replace(/^./, (char) => char.toUpperCase());

  return {
    date: `${day}_${month}_${year}`,
    nameMonth: `${monthName} ${year}`,
  };
}

export function getCurrentDate() {
  // Получаем текущую дату по Московскому времени
  const moscowTime = new Date(
    // new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" }),
    // смещаем время на два часа, чтобы формировать папку с днем, раньше
    new Date().toLocaleString("en-US", { timeZone: "Asia/Yekaterinburg" }),
  );

  const day = String(moscowTime.getDate()).padStart(2, "0");
  const month = String(moscowTime.getMonth() + 1).padStart(2, "0");
  const year = moscowTime.getFullYear();

  const currentMonth = moscowTime
    .toLocaleString("ru-RU", { month: "long" })
    .replace(/^./, (char) => char.toUpperCase());

  return {
    date: `${day}_${month}_${year}`,
    nameMonth: `${currentMonth} ${year}`,
  };
}

// пересмотреть и оптимизировать
export function getCurrentDateMoscow() {
  const moscowTime = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" }),
  );

  const day = String(moscowTime.getDate()).padStart(2, "0");
  const month = String(moscowTime.getMonth() + 1).padStart(2, "0");
  const year = moscowTime.getFullYear();

  return `${day}.${month}.${year}`;
}
