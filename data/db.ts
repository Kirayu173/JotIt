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

export async function runMigrations() {
  const db = await getDatabase();
  const versionResult = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = versionResult?.user_version ?? 0;

  if (currentVersion >= 1) {
    return;
  }

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
