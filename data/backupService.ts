import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import {
  cacheDirectory,
  deleteAsync,
  EncodingType,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

import { runInTransaction } from '@/data/db';
import { syncDueRecurringOccurrences } from '@/data/recurringService';
import { categoryRepository } from '@/data/repositories/categoryRepository';
import { recurringOccurrenceRepository } from '@/data/repositories/recurringOccurrenceRepository';
import { recurringRuleRepository } from '@/data/repositories/recurringRuleRepository';
import { settingsRepository } from '@/data/repositories/settingsRepository';
import { summaryRepository } from '@/data/repositories/summaryRepository';
import { transactionRepository } from '@/data/repositories/transactionRepository';
import { refreshClosedMonthlySnapshots } from '@/data/summarySync';
import { parseBackupPayload, serializeTransactionsToCsv } from '@/domain/backup';
import { BackupPayloadV2 } from '@/domain/types';

const EXPORT_DIR = `${cacheDirectory}jotit-exports/`;

async function ensureExportDirectory() {
  await makeDirectoryAsync(EXPORT_DIR, { intermediates: true });
}

async function writeExportFile(fileName: string, contents: string) {
  await ensureExportDirectory();
  const uri = `${EXPORT_DIR}${fileName}`;
  const info = await getInfoAsync(uri);
  if (info.exists) {
    await deleteAsync(uri, { idempotent: true });
  }
  await writeAsStringAsync(uri, contents, { encoding: EncodingType.UTF8 });
  return uri;
}

export async function createBackupPayload(): Promise<BackupPayloadV2> {
  const [settings, categories, transactions, summarySnapshots, recurringRules, recurringOccurrences] =
    await Promise.all([
      settingsRepository.getAll(),
      categoryRepository.listAll(),
      transactionRepository.listAll(),
      summaryRepository.listAll(),
      recurringRuleRepository.listAll(),
      recurringOccurrenceRepository.listAll(),
    ]);

  return {
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    app: {
      name: 'JotIt',
      version: Constants.expoConfig?.version ?? '1.0.0',
    },
    settings,
    categories,
    transactions,
    summarySnapshots,
    recurringRules,
    recurringOccurrences,
  };
}

export async function exportTransactionsCsvFile(): Promise<string> {
  const [categories, transactions] = await Promise.all([
    categoryRepository.listAll(),
    transactionRepository.listAll(),
  ]);
  const categoriesById = Object.fromEntries(categories.map((category) => [category.id, category]));
  const csvText = serializeTransactionsToCsv(transactions, categoriesById);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return writeExportFile(`jotit-transactions-${stamp}.csv`, csvText);
}

export async function exportBackupJsonFile(fileNamePrefix = 'jotit-backup'): Promise<string> {
  const payload = await createBackupPayload();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return writeExportFile(`${fileNamePrefix}-${stamp}.json`, JSON.stringify(payload, null, 2));
}

export async function shareLocalFile(uri: string, mimeType: string) {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    return false;
  }

  await Sharing.shareAsync(uri, { mimeType });
  return true;
}

export async function restoreBackupFromPicker(): Promise<BackupPayloadV2 | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const rawText = await readAsStringAsync(result.assets[0].uri, { encoding: EncodingType.UTF8 });
  const payload = parseBackupPayload(rawText);

  await exportBackupJsonFile('jotit-restore-snapshot');

  await runInTransaction(async (db) => {
    await recurringOccurrenceRepository.clearAll(db);
    await recurringRuleRepository.clearAll(db);
    await summaryRepository.clearAll(db);
    await transactionRepository.clearAll(db);
    await categoryRepository.clearAll(db);
    await settingsRepository.replaceAll(payload.settings, db);
    await categoryRepository.createMany(payload.categories, db);
    await transactionRepository.createMany(payload.transactions, db);
    await summaryRepository.createMany(payload.summarySnapshots, db);
    await recurringRuleRepository.createMany(payload.recurringRules, db);
    await recurringOccurrenceRepository.createMany(payload.recurringOccurrences, db);
  });

  await refreshClosedMonthlySnapshots();
  await syncDueRecurringOccurrences();

  return payload;
}
