import { defaultCategories } from '@/data/defaultCategories';
import { runMigrations } from '@/data/db';
import { categoryRepository } from '@/data/repositories/categoryRepository';
import { settingsRepository } from '@/data/repositories/settingsRepository';
import { defaultAppSettings } from '@/data/settings';
import { syncClosedMonthlySnapshots } from '@/data/summarySync';

export async function bootstrapDatabase() {
  await runMigrations();
  await categoryRepository.reconcileDefaults(defaultCategories);

  await settingsRepository.upsert('currency', defaultAppSettings.currency);
  await settingsRepository.upsert('reviewDefaultPeriod', defaultAppSettings.reviewDefaultPeriod);
  await settingsRepository.upsert('ledgerWindowDays', String(defaultAppSettings.ledgerWindowDays));
  await settingsRepository.upsert('ledgerGroupBy', defaultAppSettings.ledgerGroupBy);
  await syncClosedMonthlySnapshots();
}
