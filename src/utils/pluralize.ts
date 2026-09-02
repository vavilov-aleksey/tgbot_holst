/**
 * Pluralize noun according to count
 * @param {number} count Number of items
 * @param {string} one E.g. «рубль»
 * @param {string} two E.g. «рубля»
 * @param {string} five E.g. «рублей»
 * @returns {string}
 */
export function pluralize(
  count: number,
  one: string,
  two: string,
  five: string,
): string {
  const modCount = Math.floor(Math.abs(count)) % 100;
  const divCount = modCount % 10;

  if (modCount > 10 && modCount < 20) {
    return five;
  }
  if (divCount === 1) {
    return one;
  }
  if (divCount >= 2 && divCount <= 4) {
    return two;
  }
  return five;
}
