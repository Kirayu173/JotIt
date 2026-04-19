import { parseBackupPayload, serializeTransactionsToCsv } from '@/domain/backup';
import { BackupPayloadV2, Category, SummarySnapshot, TransactionRecord } from '@/domain/types';

const category: Category = {
  id: 'cat_food',
  name: '\u9910\u996e',
  type: 'expense',
  color: '#000000',
  icon: '\uD83C\uDF5C',
  sortOrder: 1,
  isDefault: true,
  createdAt: '2026-04-19T00:00:00.000Z',
  updatedAt: '2026-04-19T00:00:00.000Z',
};

const transaction: TransactionRecord = {
  id: 'txn_1',
  type: 'expense',
  amountMinor: 3200,
  currency: 'CNY',
  categoryId: 'cat_food',
  merchant: null,
  note: '\u5348\u996d',
  occurredAt: '2026-04-19T04:00:00.000Z',
  source: 'manual',
  sourceRefId: null,
  createdAt: '2026-04-19T04:00:00.000Z',
  updatedAt: '2026-04-19T04:00:00.000Z',
  deletedAt: null,
};

const summary: SummarySnapshot = {
  id: 'summary_1',
  periodType: 'month',
  periodStart: '2026-04-01T00:00:00.000Z',
  periodEnd: '2026-04-30T23:59:59.999Z',
  totalExpenseMinor: 3200,
  totalIncomeMinor: 0,
  netBalanceMinor: -3200,
  topCategoryId: 'cat_food',
  comparisonExpenseDeltaPct: undefined,
  comparisonIncomeDeltaPct: undefined,
  generatedBy: 'rules',
  narrative: '\u672c\u6708\u9910\u996e\u652f\u51fa\u8f83\u9ad8',
  generatedAt: '2026-04-30T23:59:59.999Z',
};

describe('backup helpers', () => {
  it('serializes transactions to CSV with category names', () => {
    const csv = serializeTransactionsToCsv([transaction], { [category.id]: category });
    expect(csv).toContain('"category_name"');
    expect(csv).toContain('"\u9910\u996e"');
    expect(csv).toContain('"\u5348\u996d"');
  });

  it('parses valid backup payload and rejects invalid schema', () => {
    const payload: BackupPayloadV2 = {
      schemaVersion: 2,
      exportedAt: '2026-04-19T04:00:00.000Z',
      app: { name: 'JotIt', version: '1.0.0' },
      settings: {
        currency: 'CNY',
        reviewDefaultPeriod: 'month',
        ledgerWindowDays: 365,
        ledgerGroupBy: 'day',
      },
      categories: [category],
      transactions: [transaction],
      summarySnapshots: [summary],
      recurringRules: [],
      recurringOccurrences: [],
    };

    expect(parseBackupPayload(JSON.stringify(payload)).schemaVersion).toBe(2);
    expect(() => parseBackupPayload(JSON.stringify({ schemaVersion: 1 }))).toThrow(
      'schema version unsupported'
    );
  });
});
