    import { categoryRepository } from '@/data/repositories/categoryRepository';
    import { summaryRepository } from '@/data/repositories/summaryRepository';
    import { transactionRepository } from '@/data/repositories/transactionRepository';
    import { buildDateRange, createId, dateFromMonthKey, nowIso, startOfMonth } from '@/domain/dateRange';
    import { buildSummaryResult } from '@/domain/summary';

export async function syncClosedMonthlySnapshots() {
  const categories = await categoryRepository.listAll();
  const currentMonthStart = startOfMonth(new Date());
  const monthKeys = await transactionRepository.listDistinctClosedMonthKeys(currentMonthStart.toISOString());

  for (const key of monthKeys) {
    const monthDate = dateFromMonthKey(key);
    const range = buildDateRange('month', monthDate);
    const previousRange = buildDateRange('month', new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1));

    const transactions = await transactionRepository.listBetween(range.start.toISOString(), range.end.toISOString());
    const previousTransactions = await transactionRepository.listBetween(previousRange.start.toISOString(), previousRange.end.toISOString());
    const result = buildSummaryResult(transactions, categories, previousTransactions);

        await summaryRepository.upsert({
          id: createId('summary'),
          periodType: 'month',
          periodStart: range.start.toISOString(),
          periodEnd: range.end.toISOString(),
          totalExpenseMinor: result.totalExpenseMinor,
          totalIncomeMinor: result.totalIncomeMinor,
          netBalanceMinor: result.netBalanceMinor,
      topCategoryId: result.topCategoryId,
      comparisonExpenseDeltaPct: result.comparisonExpenseDeltaPct,
      comparisonIncomeDeltaPct: result.comparisonIncomeDeltaPct,
      generatedBy: 'rules',
      narrative: result.insights.map((item) => item.text).join('\n'),
      generatedAt: nowIso(),
    });
  }
}

    export async function refreshClosedMonthlySnapshots() {
      await syncClosedMonthlySnapshots();
    }
