import * as SQLite from 'expo-sqlite';

import { getDatabase } from '@/data/db';
import { RecurringRule } from '@/domain/types';

interface RecurringRuleRow {
  id: string;
  type: RecurringRule['type'];
  amount_minor: number;
  currency: 'CNY';
  category_id: string;
  note: string | null;
  frequency: RecurringRule['frequency'];
  interval_count: number;
  anchor_date: string;
  next_occurrence_date: string;
  status: RecurringRule['status'];
  created_at: string;
  updated_at: string;
}

function mapRule(row: RecurringRuleRow): RecurringRule {
  return {
    id: row.id,
    type: row.type,
    amountMinor: row.amount_minor,
    currency: row.currency,
    categoryId: row.category_id,
    note: row.note,
    frequency: row.frequency,
    intervalCount: row.interval_count,
    anchorDate: row.anchor_date,
    nextOccurrenceDate: row.next_occurrence_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveDb(db?: SQLite.SQLiteDatabase) {
  return db ?? getDatabase();
}

export const recurringRuleRepository = {
  async listAll(): Promise<RecurringRule[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<RecurringRuleRow>(
      'SELECT * FROM recurring_rules ORDER BY updated_at DESC, created_at DESC;'
    );
    return rows.map(mapRule);
  },

  async listActiveDue(referenceDateKey: string): Promise<RecurringRule[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<RecurringRuleRow>(
      `SELECT * FROM recurring_rules
       WHERE status = 'active' AND next_occurrence_date <= ?
       ORDER BY next_occurrence_date ASC, created_at ASC;`,
      [referenceDateKey]
    );
    return rows.map(mapRule);
  },

  async getById(id: string): Promise<RecurringRule | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<RecurringRuleRow>(
      'SELECT * FROM recurring_rules WHERE id = ? LIMIT 1;',
      [id]
    );
    return row ? mapRule(row) : null;
  },

  async create(rule: RecurringRule, db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    await database.runAsync(
      `INSERT INTO recurring_rules (
        id, type, amount_minor, currency, category_id, note, frequency, interval_count,
        anchor_date, next_occurrence_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        rule.id,
        rule.type,
        rule.amountMinor,
        rule.currency,
        rule.categoryId,
        rule.note ?? null,
        rule.frequency,
        rule.intervalCount,
        rule.anchorDate,
        rule.nextOccurrenceDate,
        rule.status,
        rule.createdAt,
        rule.updatedAt,
      ]
    );
  },

  async createMany(items: RecurringRule[], db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    for (const item of items) {
      await this.create(item, database);
    }
  },

  async update(rule: RecurringRule): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE recurring_rules SET
        type = ?, amount_minor = ?, currency = ?, category_id = ?, note = ?, frequency = ?,
        interval_count = ?, anchor_date = ?, next_occurrence_date = ?, status = ?, updated_at = ?
       WHERE id = ?;`,
      [
        rule.type,
        rule.amountMinor,
        rule.currency,
        rule.categoryId,
        rule.note ?? null,
        rule.frequency,
        rule.intervalCount,
        rule.anchorDate,
        rule.nextOccurrenceDate,
        rule.status,
        rule.updatedAt,
        rule.id,
      ]
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM recurring_rules WHERE id = ?;', [id]);
  },

  async clearAll(db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    await database.runAsync('DELETE FROM recurring_rules;');
  },

  async replaceAll(items: RecurringRule[], db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    await this.clearAll(database);
    await this.createMany(items, database);
  },
};
