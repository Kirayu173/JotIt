import * as SQLite from 'expo-sqlite';

import { getDatabase } from '@/data/db';
import { dateFromMonthKey, endOfMonth, startOfMonth } from '@/domain/dateRange';
import { LedgerFilters, TransactionRecord, TransactionType } from '@/domain/types';

interface TransactionRow {
  id: string;
  type: TransactionRecord['type'];
  amount_minor: number;
  currency: 'CNY';
  category_id: string;
  merchant: string | null;
  note: string | null;
  occurred_at: string;
  source: TransactionRecord['source'];
  source_ref_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function mapTransaction(row: TransactionRow): TransactionRecord {
  return {
    id: row.id,
    type: row.type,
    amountMinor: row.amount_minor,
    currency: row.currency,
    categoryId: row.category_id,
    merchant: row.merchant,
    note: row.note,
    occurredAt: row.occurred_at,
    source: row.source,
    sourceRefId: row.source_ref_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

async function resolveDb(db?: SQLite.SQLiteDatabase) {
  return db ?? getDatabase();
}

function buildSearchQuery(filters: LedgerFilters) {
  const conditions = ['t.deleted_at IS NULL'];
  const params: Array<string | number> = [];

  if (filters.monthKey) {
    const monthDate = dateFromMonthKey(filters.monthKey);
    conditions.push('t.occurred_at BETWEEN ? AND ?');
    params.push(startOfMonth(monthDate).toISOString(), endOfMonth(monthDate).toISOString());
  }

  if (filters.categoryId) {
    conditions.push('t.category_id = ?');
    params.push(filters.categoryId);
  }

  if (filters.transactionType) {
    conditions.push('t.type = ?');
    params.push(filters.transactionType);
  }

  const keyword = filters.keyword?.trim();
  if (keyword) {
    const likeValue = `%${keyword}%`;
    conditions.push('(COALESCE(t.note, \'\') LIKE ? OR COALESCE(t.merchant, \'\') LIKE ? OR COALESCE(c.name, \'\') LIKE ?)');
    params.push(likeValue, likeValue, likeValue);
  }

  return {
    sql: `SELECT t.* FROM transactions t
          LEFT JOIN categories c ON c.id = t.category_id
          WHERE ${conditions.join(' AND ')}
          ORDER BY t.occurred_at DESC;`,
    params,
  };
}

export const transactionRepository = {
  async listBetween(startIso: string, endIso: string): Promise<TransactionRecord[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<TransactionRow>(
      `SELECT * FROM transactions
       WHERE deleted_at IS NULL AND occurred_at BETWEEN ? AND ?
       ORDER BY occurred_at DESC;`,
      [startIso, endIso]
    );
    return rows.map(mapTransaction);
  },

  async search(filters: LedgerFilters): Promise<TransactionRecord[]> {
    const db = await getDatabase();
    const query = buildSearchQuery(filters);
    const rows = await db.getAllAsync<TransactionRow>(query.sql, query.params);
    return rows.map(mapTransaction);
  },

  async listRecent(limit: number, type?: TransactionType): Promise<TransactionRecord[]> {
    const db = await getDatabase();
    const rows = type
      ? await db.getAllAsync<TransactionRow>(
          `SELECT * FROM transactions
           WHERE deleted_at IS NULL AND type = ?
           ORDER BY occurred_at DESC
           LIMIT ?;`,
          [type, limit]
        )
      : await db.getAllAsync<TransactionRow>(
          `SELECT * FROM transactions
           WHERE deleted_at IS NULL
           ORDER BY occurred_at DESC
           LIMIT ?;`,
          [limit]
        );
    return rows.map(mapTransaction);
  },

  async listAll(includeDeleted = false): Promise<TransactionRecord[]> {
    const db = await getDatabase();
    const rows = includeDeleted
      ? await db.getAllAsync<TransactionRow>('SELECT * FROM transactions ORDER BY occurred_at DESC;')
      : await db.getAllAsync<TransactionRow>(
          'SELECT * FROM transactions WHERE deleted_at IS NULL ORDER BY occurred_at DESC;'
        );
    return rows.map(mapTransaction);
  },

  async getById(id: string): Promise<TransactionRecord | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<TransactionRow>('SELECT * FROM transactions WHERE id = ? LIMIT 1;', [id]);
    return row ? mapTransaction(row) : null;
  },

  async create(input: TransactionRecord, db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount_minor, currency, category_id, merchant, note, occurred_at,
        source, source_ref_id, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        input.id,
        input.type,
        input.amountMinor,
        input.currency,
        input.categoryId,
        input.merchant ?? null,
        input.note ?? null,
        input.occurredAt,
        input.source,
        input.sourceRefId ?? null,
        input.createdAt,
        input.updatedAt,
        input.deletedAt ?? null,
      ]
    );
  },

  async createMany(items: TransactionRecord[], db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    for (const item of items) {
      await this.create(item, database);
    }
  },

  async update(input: TransactionRecord): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE transactions SET
        type = ?, amount_minor = ?, currency = ?, category_id = ?, merchant = ?, note = ?,
        occurred_at = ?, source = ?, source_ref_id = ?, updated_at = ?, deleted_at = ?
       WHERE id = ?;`,
      [
        input.type,
        input.amountMinor,
        input.currency,
        input.categoryId,
        input.merchant ?? null,
        input.note ?? null,
        input.occurredAt,
        input.source,
        input.sourceRefId ?? null,
        input.updatedAt,
        input.deletedAt ?? null,
        input.id,
      ]
    );
  },

  async softDelete(id: string, deletedAt: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE transactions SET deleted_at = ?, updated_at = ? WHERE id = ?;', [
      deletedAt,
      deletedAt,
      id,
    ]);
  },

  async restore(id: string, restoredAt: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE transactions SET deleted_at = NULL, updated_at = ? WHERE id = ?;', [
      restoredAt,
      id,
    ]);
  },

  async clearAll(db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    await database.runAsync('DELETE FROM transactions;');
  },

  async replaceAll(items: TransactionRecord[], db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    await this.clearAll(database);
    await this.createMany(items, database);
  },

  async listDistinctClosedMonthKeys(beforeIso: string): Promise<string[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ month_key: string }>(
      `SELECT DISTINCT substr(occurred_at, 1, 7) as month_key
       FROM transactions
       WHERE deleted_at IS NULL AND occurred_at < ?
       ORDER BY month_key ASC;`,
      [beforeIso]
    );
    return rows.map((row) => row.month_key);
  },
};
