import { groupTransactionsByDay } from '@/domain/list';
import { TransactionRecord } from '@/domain/types';

describe('groupTransactionsByDay', () => {
  it('groups transactions by date key', () => {
    const transactions: TransactionRecord[] = [
      { id: '1', type: 'expense', amountMinor: 1200, currency: 'CNY', categoryId: 'food', occurredAt: '2026-04-18T08:00:00.000Z', source: 'manual', createdAt: '', updatedAt: '' },
      { id: '2', type: 'expense', amountMinor: 2200, currency: 'CNY', categoryId: 'food', occurredAt: '2026-04-18T09:00:00.000Z', source: 'manual', createdAt: '', updatedAt: '' },
      { id: '3', type: 'income', amountMinor: 3300, currency: 'CNY', categoryId: 'salary', occurredAt: '2026-04-17T09:00:00.000Z', source: 'manual', createdAt: '', updatedAt: '' },
    ];
    const sections = groupTransactionsByDay(transactions);
    expect(sections).toHaveLength(2);
    expect(sections[0].data).toHaveLength(2);
  });
});
