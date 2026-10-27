export type Member = {
  id: number;
  name: string;
  phone: string;
  hasPhoto: boolean;
  isActive: boolean;
  planMonths: number | null;
  expiry: string | null;
  daysLeft: number | null;
  paymentDone: boolean;
  paymentDate: string | null;
  paymentMode: string | null;
};
