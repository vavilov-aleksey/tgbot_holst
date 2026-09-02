export const reformatPhoneNumber = (phoneNumber: string) => {
  return phoneNumber
    ?.replace(/^8/, "+7")
    ?.replace(/^(\+\d{1})(\d{3})(\d{3})(\d{2})(\d{2})$/, "$1 $2 $3-$4-$5")
    ?.replace("+", "");
};
