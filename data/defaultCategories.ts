import { nowIso } from '@/domain/dateRange';
import { Category } from '@/domain/types';

const timestamp = nowIso();

export const defaultCategories: Category[] = [
  { id: 'cat_food', name: '\u9910\u996e', type: 'expense', color: '#E27D60', icon: '\uD83C\uDF5C', sortOrder: 1, isDefault: true, createdAt: timestamp, updatedAt: timestamp },
  { id: 'cat_transit', name: '\u4ea4\u901a', type: 'expense', color: '#6D9BF1', icon: '\uD83D\uDE8C', sortOrder: 2, isDefault: true, createdAt: timestamp, updatedAt: timestamp },
  { id: 'cat_daily', name: '\u65e5\u7528', type: 'expense', color: '#5AAE9B', icon: '\uD83E\uDDFA', sortOrder: 3, isDefault: true, createdAt: timestamp, updatedAt: timestamp },
  { id: 'cat_shopping', name: '\u8d2d\u7269', type: 'expense', color: '#DA6A8D', icon: '\uD83D\uDED2', sortOrder: 4, isDefault: true, createdAt: timestamp, updatedAt: timestamp },
  { id: 'cat_fun', name: '\u5a31\u4e50', type: 'expense', color: '#9C7BD5', icon: '\uD83C\uDFAE', sortOrder: 5, isDefault: true, createdAt: timestamp, updatedAt: timestamp },
  { id: 'cat_home', name: '\u5c45\u4f4f', type: 'expense', color: '#D39A4F', icon: '\uD83C\uDFE0', sortOrder: 6, isDefault: true, createdAt: timestamp, updatedAt: timestamp },
  { id: 'cat_health', name: '\u533b\u7597', type: 'expense', color: '#52B788', icon: '\uD83D\uDC8A', sortOrder: 7, isDefault: true, createdAt: timestamp, updatedAt: timestamp },
  { id: 'cat_other_expense', name: '\u5176\u4ed6', type: 'expense', color: '#88929D', icon: '\u2733', sortOrder: 8, isDefault: true, createdAt: timestamp, updatedAt: timestamp },
  { id: 'cat_salary', name: '\u5de5\u8d44', type: 'income', color: '#2B8A67', icon: '\uD83D\uDCBC', sortOrder: 9, isDefault: true, createdAt: timestamp, updatedAt: timestamp },
  { id: 'cat_reimburse', name: '\u62a5\u9500', type: 'income', color: '#4C956C', icon: '\uD83E\uDDFE', sortOrder: 10, isDefault: true, createdAt: timestamp, updatedAt: timestamp },
  { id: 'cat_other_income', name: '\u5176\u4ed6', type: 'income', color: '#6D9773', icon: '\uD83D\uDCB0', sortOrder: 11, isDefault: true, createdAt: timestamp, updatedAt: timestamp },
];
