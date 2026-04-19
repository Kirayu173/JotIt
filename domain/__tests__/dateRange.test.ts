import { buildDateRange, getPreviousComparableRange, shiftAnchorDate, startOfMonth } from '@/domain/dateRange';

describe('date range helpers', () => {
  it('builds month range labels', () => {
    const anchor = new Date('2026-04-19T10:30:00.000Z');
    const range = buildDateRange('month', anchor);
    expect(range.label).toBe('2026\u5e744\u6708');
    expect(range.start.getDate()).toBe(1);
  });

  it('builds previous comparable ranges with same duration', () => {
    const range = buildDateRange('week', new Date('2026-04-19T10:30:00.000Z'));
    const previous = getPreviousComparableRange(range);
    expect(previous.end.getTime()).toBeLessThan(range.start.getTime());
  });

  it('shifts months backward and forward', () => {
    const start = startOfMonth(new Date('2026-04-19T10:30:00.000Z'));
    const previous = shiftAnchorDate('month', start, 'prev');
    const next = shiftAnchorDate('month', start, 'next');
    expect(previous.getMonth()).toBe(2);
    expect(next.getMonth()).toBe(4);
  });
});
