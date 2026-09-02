export const getMarksByWeight = (weight: number) => {
  // Проверяем границы
  if (weight < 101) {
    return 100;
  }

  // Базовая формула
  const baseWeight = 101; // Начальный вес
  const baseStamps = 155; // Марки для начального веса
  const stepGrams = 20; // Шаг по весу (грамм)
  const stepStamps = 5; // Шаг по маркам (штук)

  // Вычисляем количество полных 20-граммовых шагов
  const steps = Math.floor((weight - baseWeight) / stepGrams);

  // Вычисляем количество марок
  return baseStamps + steps * stepStamps;
};
