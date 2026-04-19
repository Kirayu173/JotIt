import { dateFromDateKey, dateToKey, todayDateKey } from '@/domain/dateRange';
import { RecurringFrequency } from '@/domain/types';

export function advanceRecurringDate(
  currentDateKey: string,
  frequency: RecurringFrequency,
  intervalCount: number
): string {
  const next = dateFromDateKey(currentDateKey);
  const safeInterval = Math.max(1, intervalCount);

  if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7 * safeInterval);
  } else if (frequency === 'monthly') {
    next.setMonth(next.getMonth() + safeInterval);
  } else {
    next.setFullYear(next.getFullYear() + safeInterval);
  }

  return dateToKey(next);
}

export function isRecurringDue(dateKey: string, referenceDateKey: string = todayDateKey()): boolean {
  return dateKey <= referenceDateKey;
}

export function frequencyLabel(frequency: RecurringFrequency): string {
  if (frequency === 'weekly') return '\u6bcf\u5468';
  if (frequency === 'monthly') return '\u6bcf\u6708';
  return '\u6bcf\u5e74';
}
