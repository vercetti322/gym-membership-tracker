import type { Member } from './../types';
import dayjs from 'dayjs';

export const plural = (n: number) => (n === 1 ? 'day' : 'days');

export const getMemberStatus = (member: Member) => {
  const daysLeft = member.daysLeft;

  if (daysLeft === null) return { text: 'No plan', color: 'gray' as const };

  if (daysLeft < 0) {
    const late = Math.abs(daysLeft);
    return { text: `${late} ${plural(late)} late`, color: 'red' as const };
  }

  if (daysLeft === 0) return { text: 'Due today', color: 'red' as const };

  return {
    text: `${daysLeft} ${plural(daysLeft)} left`,
    color: 'green' as const,
  };
};

// Renew is allowed on the last day of the plan or after it
export const canRenew = (m: Member) => m.daysLeft !== null && m.daysLeft <= 0;

export const formatDate = (date: string | null) =>
  date ? dayjs(date).format('DD MMM YYYY') : '-';
