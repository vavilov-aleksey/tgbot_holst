export type AlfaBankWebhookType = {
  orderNumber: string;
  operation: "deposited" | "declinedByTimeout";
  approvedAmount: number;
  paymentDate: string;
};
