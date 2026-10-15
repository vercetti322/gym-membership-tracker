import type { Member } from './../types';
import dayjs from 'dayjs';

export const plural = (n: number) => (n === 1 ? 'day' : 'days');

// Renew is allowed on the last day of the plan or after it
export const canRenew = (m: Member) => m.daysLeft !== null && m.daysLeft <= 0;

export const formatDate = (date: string | null) =>
  date ? dayjs(date).format('DD MMM YYYY') : '-';
