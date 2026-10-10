export type Member = {
  id: number;
  name: string;
  phone: string;
  planMonths: number | null;
  expiry: string | null;
  daysLeft: number | null;
  paymentDone: boolean;
  paymentDate: string | null;
  paymentMode: string | null;
};
