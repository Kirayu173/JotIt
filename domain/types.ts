export type TransactionType = 'expense' | 'income';
export type TransactionSource = 'manual' | 'recurring' | 'nlp' | 'ocr' | 'import';
export type CategoryType = 'expense' | 'income' | 'both';
export type ReviewPeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  sortOrder: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionRecord {
  id: string;
  type: TransactionType;
  amountMinor: number;
  currency: 'CNY';
  categoryId: string;
  merchant?: string | null;
  note?: string | null;
  occurredAt: string;
  source: TransactionSource;
  sourceRefId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface TransactionDraft {
  id?: string;
  type: TransactionType;
  amountInput: string;
  categoryId: string;
  note: string;
  occurredAt: string;
}

export interface SummarySnapshot {
  id: string;
  periodType: 'month';
  periodStart: string;
  periodEnd: string;
  totalExpenseMinor: number;
  totalIncomeMinor: number;
  netBalanceMinor: number;
  topCategoryId?: string | null;
  comparisonExpenseDeltaPct?: number | null;
  comparisonIncomeDeltaPct?: number | null;
  generatedBy: 'rules';
  narrative?: string | null;
  generatedAt: string;
}

export interface SummaryInsight {
  id: string;
  text: string;
}

export interface SummaryMetric {
  categoryId: string;
  name: string;
  color: string;
  amountMinor: number;
  percentage: number;
  count: number;
}

export interface SummaryResult {
  totalExpenseMinor: number;
  totalIncomeMinor: number;
  netBalanceMinor: number;
  topCategoryId?: string;
  topCategoryName?: string;
  comparisonExpenseDeltaPct?: number;
  comparisonIncomeDeltaPct?: number;
  topCategories: SummaryMetric[];
  insights: SummaryInsight[];
  transactionCount: number;
}

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
  period: ReviewPeriod;
}

export interface LedgerSection {
  title: string;
  dateKey: string;
  data: TransactionRecord[];
}

export interface AppSettings {
  currency: 'CNY';
  reviewDefaultPeriod: Extract<ReviewPeriod, 'month'>;
  ledgerWindowDays: number;
  ledgerGroupBy: 'day';
}
