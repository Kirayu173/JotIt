import * as SQLite from 'expo-sqlite';

import { getDatabase } from '@/data/db';
import { SummarySnapshot } from '@/domain/types';

interface SummaryRow {
  id: string;
  period_type: 'month';
  period_start: string;
  period_end: string;
  total_expense_minor: number;
  total_income_minor: number;
  net_balance_minor: number;
  top_category_id: string | null;
  comparison_expense_delta_pct: number | null;
  comparison_income_delta_pct: number | null;
  generated_by: 'rules';
  narrative: string | null;
  generated_at: string;
}

function mapSummary(row: SummaryRow): SummarySnapshot {
  return {
    id: row.id,
    periodType: row.period_type,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    totalExpenseMinor: row.total_expense_minor,
    totalIncomeMinor: row.total_income_minor,
    netBalanceMinor: row.net_balance_minor,
    topCategoryId: row.top_category_id,
    comparisonExpenseDeltaPct: row.comparison_expense_delta_pct ?? undefined,
    comparisonIncomeDeltaPct: row.comparison_income_delta_pct ?? undefined,
    generatedBy: row.generated_by,
    narrative: row.narrative,
    generatedAt: row.generated_at,
  };
}

async function resolveDb(db?: SQLite.SQLiteDatabase) {
  return db ?? getDatabase();
}

export const summaryRepository = {
  async getMonthlySnapshot(periodStart: string, periodEnd: string): Promise<SummarySnapshot | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<SummaryRow>(
      'SELECT * FROM summary_snapshots WHERE period_type = ? AND period_start = ? AND period_end = ? LIMIT 1;',
      ['month', periodStart, periodEnd]
    );
    return row ? mapSummary(row) : null;
  },

  async upsert(snapshot: SummarySnapshot): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO summary_snapshots (
        id, period_type, period_start, period_end, total_expense_minor, total_income_minor,
        net_balance_minor, top_category_id, comparison_expense_delta_pct,
        comparison_income_delta_pct, generated_by, narrative, generated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(period_type, period_start, period_end)
      DO UPDATE SET
        total_expense_minor = excluded.total_expense_minor,
        total_income_minor = excluded.total_income_minor,
        net_balance_minor = excluded.net_balance_minor,
        top_category_id = excluded.top_category_id,
        comparison_expense_delta_pct = excluded.comparison_expense_delta_pct,
        comparison_income_delta_pct = excluded.comparison_income_delta_pct,
        generated_by = excluded.generated_by,
        narrative = excluded.narrative,
        generated_at = excluded.generated_at;`,
      [
        snapshot.id,
        snapshot.periodType,
        snapshot.periodStart,
        snapshot.periodEnd,
        snapshot.totalExpenseMinor,
        snapshot.totalIncomeMinor,
        snapshot.netBalanceMinor,
        snapshot.topCategoryId ?? null,
        snapshot.comparisonExpenseDeltaPct ?? null,
        snapshot.comparisonIncomeDeltaPct ?? null,
        snapshot.generatedBy,
        snapshot.narrative ?? null,
        snapshot.generatedAt,
      ]
    );
  },

  async listAll(): Promise<SummarySnapshot[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SummaryRow>(
      'SELECT * FROM summary_snapshots ORDER BY period_start DESC, generated_at DESC;'
    );
    return rows.map(mapSummary);
  },

  async createMany(items: SummarySnapshot[], db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    for (const item of items) {
      await database.runAsync(
        `INSERT INTO summary_snapshots (
          id, period_type, period_start, period_end, total_expense_minor, total_income_minor,
          net_balance_minor, top_category_id, comparison_expense_delta_pct,
          comparison_income_delta_pct, generated_by, narrative, generated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          item.id,
          item.periodType,
          item.periodStart,
          item.periodEnd,
          item.totalExpenseMinor,
          item.totalIncomeMinor,
          item.netBalanceMinor,
          item.topCategoryId ?? null,
          item.comparisonExpenseDeltaPct ?? null,
          item.comparisonIncomeDeltaPct ?? null,
          item.generatedBy,
          item.narrative ?? null,
          item.generatedAt,
        ]
      );
    }
  },

  async clearAll(db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    await database.runAsync('DELETE FROM summary_snapshots;');
  },

  async replaceAll(items: SummarySnapshot[], db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    await this.clearAll(database);
    await this.createMany(items, database);
  },
};
