import { advanceRecurringDate, frequencyLabel, isRecurringDue } from '@/domain/recurring';

describe('recurring helpers', () => {
  it('advances weekly and monthly recurring dates', () => {
    expect(advanceRecurringDate('2026-04-19', 'weekly', 1)).toBe('2026-04-26');
    expect(advanceRecurringDate('2026-04-19', 'monthly', 1)).toBe('2026-05-19');
    expect(advanceRecurringDate('2026-04-19', 'yearly', 1)).toBe('2027-04-19');
  });

  it('checks due state and returns localized labels', () => {
    expect(isRecurringDue('2026-04-01', '2026-04-19')).toBe(true);
    expect(isRecurringDue('2026-05-01', '2026-04-19')).toBe(false);
    expect(frequencyLabel('monthly')).toBe('\u6bcf\u6708');
  });
});
