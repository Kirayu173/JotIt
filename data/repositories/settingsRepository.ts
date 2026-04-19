import * as SQLite from 'expo-sqlite';

import { getDatabase } from '@/data/db';
import { defaultAppSettings } from '@/data/settings';
import { AppSettings } from '@/domain/types';

async function resolveDb(db?: SQLite.SQLiteDatabase) {
  return db ?? getDatabase();
}

export const settingsRepository = {
  async getAll(): Promise<AppSettings> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM app_settings;');
    const settings = { ...defaultAppSettings };

    rows.forEach((row) => {
      if (row.key === 'currency' && row.value === 'CNY') settings.currency = 'CNY';
      if (row.key === 'reviewDefaultPeriod' && row.value === 'month') settings.reviewDefaultPeriod = 'month';
      if (row.key === 'ledgerWindowDays') settings.ledgerWindowDays = Number(row.value) || defaultAppSettings.ledgerWindowDays;
      if (row.key === 'ledgerGroupBy' && row.value === 'day') settings.ledgerGroupBy = 'day';
    });

    return settings;
  },

  async upsert(key: keyof AppSettings, value: string, db?: SQLite.SQLiteDatabase) {
    const database = await resolveDb(db);
    await database.runAsync(
      'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
      [key, value]
    );
  },

  async replaceAll(settings: AppSettings, db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    await database.runAsync('DELETE FROM app_settings;');
    await this.upsert('currency', settings.currency, database);
    await this.upsert('reviewDefaultPeriod', settings.reviewDefaultPeriod, database);
    await this.upsert('ledgerWindowDays', String(settings.ledgerWindowDays), database);
    await this.upsert('ledgerGroupBy', settings.ledgerGroupBy, database);
  },
};
