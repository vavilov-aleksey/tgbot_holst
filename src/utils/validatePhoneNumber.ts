export const validatePhoneNumber = (phoneNumber: string) => {
  // Регулярное выражение для проверки номера телефона по маске 8xxxxxxxxxx
  const pattern = /^8\d{10}$/;
  return pattern.test(phoneNumber);
};
