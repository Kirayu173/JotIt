import { formatSectionDate, toDateKey } from '@/domain/dateRange';
import { LedgerSection, TransactionRecord } from '@/domain/types';

export function groupTransactionsByDay(transactions: TransactionRecord[]): LedgerSection[] {
  const sections = new Map<string, TransactionRecord[]>();

  transactions.forEach((transaction) => {
    const key = toDateKey(transaction.occurredAt);
    const current = sections.get(key) ?? [];
    current.push(transaction);
    sections.set(key, current);
  });

  return [...sections.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([dateKey, items]) => ({
      dateKey,
      title: formatSectionDate(dateKey),
      data: items.sort((left, right) => (left.occurredAt < right.occurredAt ? 1 : -1)),
    }));
}
