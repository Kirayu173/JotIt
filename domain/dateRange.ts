import { DateRange, ReviewPeriod } from '@/domain/types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function nowIso(): string {
  return new Date().toISOString();
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function startOfWeek(date: Date): Date {
  const next = startOfDay(date);
  const weekday = next.getDay();
  const delta = weekday === 0 ? -6 : 1 - weekday;
  next.setDate(next.getDate() + delta);
  return next;
}

export function endOfWeek(date: Date): Date {
  const next = startOfWeek(date);
  next.setDate(next.getDate() + 6);
  return endOfDay(next);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function startOfQuarter(date: Date): Date {
  const month = Math.floor(date.getMonth() / 3) * 3;
  return new Date(date.getFullYear(), month, 1, 0, 0, 0, 0);
}

export function endOfQuarter(date: Date): Date {
  const start = startOfQuarter(date);
  return new Date(start.getFullYear(), start.getMonth() + 3, 0, 23, 59, 59, 999);
}

export function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

export function endOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

export function subtractDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * DAY_MS);
}

export function formatSectionDate(dateKey: string): string {
  const date = dateFromDateKey(dateKey);
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diff = Math.round((today.getTime() - target.getTime()) / DAY_MS);
  if (diff === 0) return '\u4eca\u5929';
  if (diff === 1) return '\u6628\u5929';
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(date);
}

export function formatDateLabel(iso: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

export function formatDateTimeLabel(iso: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatReviewRangeLabel(start: Date, end: Date): string {
  const formatter = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export function buildDateRange(period: ReviewPeriod, anchorDate: Date, customStart?: Date, customEnd?: Date): DateRange {
  if (period === 'custom' && customStart && customEnd) {
    return { period, start: startOfDay(customStart), end: endOfDay(customEnd), label: formatReviewRangeLabel(customStart, customEnd) };
  }
  if (period === 'week') {
    const start = startOfWeek(anchorDate);
    const end = endOfWeek(anchorDate);
    return { period, start, end, label: formatReviewRangeLabel(start, end) };
  }
  if (period === 'month') {
    const start = startOfMonth(anchorDate);
    const end = endOfMonth(anchorDate);
    return { period, start, end, label: `${anchorDate.getFullYear()}\u5e74${anchorDate.getMonth() + 1}\u6708` };
  }
  if (period === 'quarter') {
    const start = startOfQuarter(anchorDate);
    const end = endOfQuarter(anchorDate);
    return { period, start, end, label: `${anchorDate.getFullYear()}\u5e74\u7b2c${Math.floor(anchorDate.getMonth() / 3) + 1}\u5b63\u5ea6` };
  }
  const start = startOfYear(anchorDate);
  const end = endOfYear(anchorDate);
  return { period: 'year', start, end, label: `${anchorDate.getFullYear()}\u5e74` };
}

export function getPreviousComparableRange(range: DateRange): DateRange {
  const duration = range.end.getTime() - range.start.getTime() + 1;
  const previousEnd = new Date(range.start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration + 1);
  return { period: range.period, start: previousStart, end: previousEnd, label: formatReviewRangeLabel(previousStart, previousEnd) };
}

export function shiftAnchorDate(period: ReviewPeriod, anchorDate: Date, direction: 'prev' | 'next'): Date {
  const next = new Date(anchorDate);
  const delta = direction === 'next' ? 1 : -1;
  if (period === 'week') next.setDate(next.getDate() + 7 * delta);
  if (period === 'month') next.setMonth(next.getMonth() + delta);
  if (period === 'quarter') next.setMonth(next.getMonth() + 3 * delta);
  if (period === 'year') next.setFullYear(next.getFullYear() + delta);
  return next;
}

export function canShiftForward(period: ReviewPeriod, anchorDate: Date): boolean {
  if (period === 'custom') return false;
  const shifted = shiftAnchorDate(period, anchorDate, 'next');
  const nextRange = buildDateRange(period, shifted);
  return nextRange.start <= new Date();
}

export function toDateKey(iso: string): string {
  return dateToKey(new Date(iso));
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthKeyFromIso(iso: string): string {
  return monthKey(new Date(iso));
}

export function dateToKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function dateFromDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function dateFromMonthKey(key: string): Date {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

export function toDateOnlyIso(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  return normalized.toISOString();
}
