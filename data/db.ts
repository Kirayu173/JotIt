import * as SQLite from 'expo-sqlite';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('jotit.db');
  }

  const database = await databasePromise;
  await database.execAsync('PRAGMA foreign_keys = ON;');
  return database;
}

export async function runInTransaction<T>(work: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
  const db = await getDatabase();
  await db.execAsync('BEGIN IMMEDIATE TRANSACTION;');
  try {
    const result = await work(db);
    await db.execAsync('COMMIT;');
    return result;
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}

export async function runMigrations() {
  const db = await getDatabase();
  const versionResult = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = versionResult?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        is_default INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        amount_minor INTEGER NOT NULL,
        currency TEXT NOT NULL,
        category_id TEXT NOT NULL,
        merchant TEXT,
        note TEXT,
        occurred_at TEXT NOT NULL,
        source TEXT NOT NULL,
        source_ref_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        FOREIGN KEY(category_id) REFERENCES categories(id)
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON transactions(occurred_at DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON transactions(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);

      CREATE TABLE IF NOT EXISTS summary_snapshots (
        id TEXT PRIMARY KEY NOT NULL,
        period_type TEXT NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        total_expense_minor INTEGER NOT NULL,
        total_income_minor INTEGER NOT NULL,
        net_balance_minor INTEGER NOT NULL,
        top_category_id TEXT,
        comparison_expense_delta_pct REAL,
        comparison_income_delta_pct REAL,
        generated_by TEXT NOT NULL,
        narrative TEXT,
        generated_at TEXT NOT NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_summary_period ON summary_snapshots(period_type, period_start, period_end);

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );

      PRAGMA user_version = 1;
    `);
  }

  if (currentVersion < 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS recurring_rules (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        amount_minor INTEGER NOT NULL,
        currency TEXT NOT NULL,
        category_id TEXT NOT NULL,
        note TEXT,
        frequency TEXT NOT NULL,
        interval_count INTEGER NOT NULL,
        anchor_date TEXT NOT NULL,
        next_occurrence_date TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(category_id) REFERENCES categories(id)
      );

      CREATE TABLE IF NOT EXISTS recurring_occurrences (
        id TEXT PRIMARY KEY NOT NULL,
        rule_id TEXT NOT NULL,
        planned_date TEXT NOT NULL,
        status TEXT NOT NULL,
        confirmed_transaction_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(rule_id) REFERENCES recurring_rules(id) ON DELETE CASCADE,
        FOREIGN KEY(confirmed_transaction_id) REFERENCES transactions(id)
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_recurring_occurrences_rule_date
        ON recurring_occurrences(rule_id, planned_date);
      CREATE INDEX IF NOT EXISTS idx_recurring_occurrences_status_date
        ON recurring_occurrences(status, planned_date);
      CREATE INDEX IF NOT EXISTS idx_recurring_rules_status_next_date
        ON recurring_rules(status, next_occurrence_date);
      CREATE INDEX IF NOT EXISTS idx_transactions_type_occurred_at
        ON transactions(type, occurred_at DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_source_ref_id
        ON transactions(source_ref_id);

      PRAGMA user_version = 2;
    `);
  }
}
