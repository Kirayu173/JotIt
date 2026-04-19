import { BackupPayloadV2, Category, TransactionRecord } from '@/domain/types';

function csvCell(value: string | number | null | undefined): string {
  const normalized = value == null ? '' : String(value);
  const escaped = normalized.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function serializeTransactionsToCsv(
  transactions: TransactionRecord[],
  categoriesById: Record<string, Category>
): string {
  const header = [
    'id',
    'date',
    'type',
    'amount_minor',
    'currency',
    'category_id',
    'category_name',
    'note',
    'merchant',
    'source',
    'source_ref_id',
    'created_at',
    'updated_at',
  ];

  const rows = transactions.map((transaction) => {
    const category = categoriesById[transaction.categoryId];
    return [
      transaction.id,
      transaction.occurredAt,
      transaction.type,
      transaction.amountMinor,
      transaction.currency,
      transaction.categoryId,
      category?.name ?? '',
      transaction.note ?? '',
      transaction.merchant ?? '',
      transaction.source,
      transaction.sourceRefId ?? '',
      transaction.createdAt,
      transaction.updatedAt,
    ]
      .map(csvCell)
      .join(',');
  });

  return [header.map(csvCell).join(','), ...rows].join('\n');
}

function ensureArray(value: unknown, fieldName: string) {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} invalid`);
  }
}

export function parseBackupPayload(rawText: string): BackupPayloadV2 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('backup json invalid');
  }

  const payload = parsed as Partial<BackupPayloadV2> | null;
  if (!payload || payload.schemaVersion !== 2) {
    throw new Error('schema version unsupported');
  }

  ensureArray(payload.categories, 'categories');
  ensureArray(payload.transactions, 'transactions');
  ensureArray(payload.summarySnapshots, 'summarySnapshots');
  ensureArray(payload.recurringRules, 'recurringRules');
  ensureArray(payload.recurringOccurrences, 'recurringOccurrences');

  if (!payload.settings || payload.settings.currency !== 'CNY') {
    throw new Error('settings invalid');
  }

  return payload as BackupPayloadV2;
}
