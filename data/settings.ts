import { AppSettings } from '@/domain/types';

export const defaultAppSettings: AppSettings = {
  currency: 'CNY',
  reviewDefaultPeriod: 'month',
  ledgerWindowDays: 365,
  ledgerGroupBy: 'day',
};
