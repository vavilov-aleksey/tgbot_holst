import { CertificateEnum } from "../../app/types/certificateType";

export type ReportType = {
  userId: number;
  phone: string;
  index: string;
  userName: string;
  typePhoto: string;
  countPhoto: number;
  price: number;
  orderId: string;
  date: string;
  referrerLink: string;
};

export type ReportCertificateType = {
  userId: number;
  phone: string;
  countPhoto: number;
  type: CertificateEnum;
  price: number;
  orderId: string;
  date: string;
  certificateNumber: string;
  referrerLink: string;
};

export type FeedbackType = {
  userId: number;
  comment: string;
  date: string;
  referrerLink: string;
};

export type CdekInfoType = {
  userId: number;
  phone: string;
  countPhoto: number;
  price: number;
  deliveryPayment: number;
};
