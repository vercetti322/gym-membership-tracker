export type MemberRow = {
  id: number;
  name: string;
  phone: string;
  isActive: number;
  planMonths: number | null;
  expiry: string | null;
  daysLeft: number | null;
  paymentDone: number | null;
  paymentDate: string | null;
  paymentMode: string | null;
};