import * as SQLite from 'expo-sqlite';

import { getDatabase } from '@/data/db';
import { RecurringOccurrence } from '@/domain/types';

interface RecurringOccurrenceRow {
  id: string;
  rule_id: string;
  planned_date: string;
  status: RecurringOccurrence['status'];
  confirmed_transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

function mapOccurrence(row: RecurringOccurrenceRow): RecurringOccurrence {
  return {
    id: row.id,
    ruleId: row.rule_id,
    plannedDate: row.planned_date,
    status: row.status,
    confirmedTransactionId: row.confirmed_transaction_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveDb(db?: SQLite.SQLiteDatabase) {
  return db ?? getDatabase();
}

export const recurringOccurrenceRepository = {
  async listPending(): Promise<RecurringOccurrence[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<RecurringOccurrenceRow>(
      `SELECT * FROM recurring_occurrences
       WHERE status = 'pending'
       ORDER BY planned_date ASC, created_at ASC;`
    );
    return rows.map(mapOccurrence);
  },

  async listAll(): Promise<RecurringOccurrence[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<RecurringOccurrenceRow>(
      'SELECT * FROM recurring_occurrences ORDER BY planned_date DESC, created_at DESC;'
    );
    return rows.map(mapOccurrence);
  },

  async getById(id: string): Promise<RecurringOccurrence | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<RecurringOccurrenceRow>(
      'SELECT * FROM recurring_occurrences WHERE id = ? LIMIT 1;',
      [id]
    );
    return row ? mapOccurrence(row) : null;
  },

  async getByRuleAndDate(ruleId: string, plannedDate: string): Promise<RecurringOccurrence | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<RecurringOccurrenceRow>(
      `SELECT * FROM recurring_occurrences
       WHERE rule_id = ? AND planned_date = ?
       LIMIT 1;`,
      [ruleId, plannedDate]
    );
    return row ? mapOccurrence(row) : null;
  },

  async create(occurrence: RecurringOccurrence, db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    await database.runAsync(
      `INSERT INTO recurring_occurrences (
        id, rule_id, planned_date, status, confirmed_transaction_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        occurrence.id,
        occurrence.ruleId,
        occurrence.plannedDate,
        occurrence.status,
        occurrence.confirmedTransactionId ?? null,
        occurrence.createdAt,
        occurrence.updatedAt,
      ]
    );
  },

  async createMany(items: RecurringOccurrence[], db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    for (const item of items) {
      await this.create(item, database);
    }
  },

  async markConfirmed(id: string, transactionId: string, updatedAt: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE recurring_occurrences SET
        status = 'confirmed',
        confirmed_transaction_id = ?,
        updated_at = ?
       WHERE id = ?;`,
      [transactionId, updatedAt, id]
    );
  },

  async markSkipped(id: string, updatedAt: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE recurring_occurrences SET
        status = 'skipped',
        updated_at = ?
       WHERE id = ?;`,
      [updatedAt, id]
    );
  },

  async clearAll(db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    await database.runAsync('DELETE FROM recurring_occurrences;');
  },

  async replaceAll(items: RecurringOccurrence[], db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    await this.clearAll(database);
    await this.createMany(items, database);
  },
};
