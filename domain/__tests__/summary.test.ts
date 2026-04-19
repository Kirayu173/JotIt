import { buildSummaryResult } from '@/domain/summary';
import { Category, TransactionRecord } from '@/domain/types';

const categories: Category[] = [
  { id: 'food', name: '\u9910\u996e', type: 'expense', color: '#E27D60', icon: '\u9910', sortOrder: 1, isDefault: true, createdAt: '', updatedAt: '' },
  { id: 'salary', name: '\u5de5\u8d44', type: 'income', color: '#2B8A67', icon: '\u85aa', sortOrder: 2, isDefault: true, createdAt: '', updatedAt: '' },
];

const current: TransactionRecord[] = [
  { id: '1', type: 'expense', amountMinor: 3200, currency: 'CNY', categoryId: 'food', occurredAt: '2026-04-01T08:00:00.000Z', source: 'manual', createdAt: '', updatedAt: '' },
  { id: '2', type: 'income', amountMinor: 500000, currency: 'CNY', categoryId: 'salary', occurredAt: '2026-04-01T09:00:00.000Z', source: 'manual', createdAt: '', updatedAt: '' },
];

const previous: TransactionRecord[] = [
  { id: '3', type: 'expense', amountMinor: 2000, currency: 'CNY', categoryId: 'food', occurredAt: '2026-03-01T08:00:00.000Z', source: 'manual', createdAt: '', updatedAt: '' },
];

describe('buildSummaryResult', () => {
  it('aggregates totals and insights', () => {
    const result = buildSummaryResult(current, categories, previous);
    expect(result.totalExpenseMinor).toBe(3200);
    expect(result.totalIncomeMinor).toBe(500000);
    expect(result.topCategoryName).toBe('\u9910\u996e');
    expect(result.insights[0]?.text).toContain('\u672c\u671f\u652f\u51fa');
    expect(result.insights.length).toBeGreaterThan(0);
  });
});
