import { formatCurrency } from '@/domain/money';
import { Category, SummaryInsight, SummaryMetric, SummaryResult, TransactionRecord } from '@/domain/types';

function safeDelta(current: number, previous: number): number | undefined {
  if (previous <= 0) {
    return undefined;
  }

  return ((current - previous) / previous) * 100;
}

export function buildSummaryResult(
  transactions: TransactionRecord[],
  categories: Category[],
  previousTransactions: TransactionRecord[] = []
): SummaryResult {
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const expenseTotals = new Map<string, { amountMinor: number; count: number }>();
  const previousExpenseTotal = previousTransactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amountMinor, 0);
  const previousIncomeTotal = previousTransactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amountMinor, 0);

  let totalExpenseMinor = 0;
  let totalIncomeMinor = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === 'expense') {
      totalExpenseMinor += transaction.amountMinor;
      const current = expenseTotals.get(transaction.categoryId) ?? { amountMinor: 0, count: 0 };
      current.amountMinor += transaction.amountMinor;
      current.count += 1;
      expenseTotals.set(transaction.categoryId, current);
    } else {
      totalIncomeMinor += transaction.amountMinor;
    }
  });

  const topCategories: SummaryMetric[] = [...expenseTotals.entries()]
    .map(([categoryId, item]) => {
      const category = categoryMap.get(categoryId);
      return {
        categoryId,
        name: category?.name ?? '\u672a\u5206\u7c7b',
        color: category?.color ?? '#D8E0D6',
        amountMinor: item.amountMinor,
        count: item.count,
        percentage: totalExpenseMinor > 0 ? item.amountMinor / totalExpenseMinor : 0,
      };
    })
    .sort((left, right) => right.amountMinor - left.amountMinor);

  const topCategory = topCategories[0];
  const expenseDelta = safeDelta(totalExpenseMinor, previousExpenseTotal);
  const incomeDelta = safeDelta(totalIncomeMinor, previousIncomeTotal);
  const netBalanceMinor = totalIncomeMinor - totalExpenseMinor;
  const insights: SummaryInsight[] = [
    {
      id: 'overview',
      text: `\u672c\u671f\u652f\u51fa ${formatCurrency(totalExpenseMinor)}\uff0c\u6536\u5165 ${formatCurrency(totalIncomeMinor)}\u3002`,
    },
  ];

  if (typeof expenseDelta === 'number') {
    insights.push({
      id: 'expense-delta',
      text: `\u652f\u51fa\u8f83\u4e0a\u4e00\u5468\u671f${expenseDelta >= 0 ? '\u589e\u52a0' : '\u51cf\u5c11'} ${Math.abs(expenseDelta).toFixed(0)}%\u3002`,
    });
  }

  if (topCategory) {
    insights.push({
      id: 'top-category',
      text: `${topCategory.name}\u662f\u5f53\u524d\u6700\u5927\u652f\u51fa\u5206\u7c7b\uff0c\u5360\u603b\u652f\u51fa\u7684 ${(topCategory.percentage * 100).toFixed(0)}%\u3002`,
    });
  }

  insights.push({
    id: 'balance',
    text:
      netBalanceMinor >= 0
        ? `\u5f53\u524d\u533a\u95f4\u7ed3\u4f59 ${formatCurrency(netBalanceMinor)}\u3002`
        : `\u5f53\u524d\u533a\u95f4\u8d85\u652f ${formatCurrency(Math.abs(netBalanceMinor))}\u3002`,
  });

  if (typeof incomeDelta === 'number' && totalIncomeMinor > 0) {
    insights.push({
      id: 'income-delta',
      text: `\u6536\u5165\u8f83\u4e0a\u4e00\u5468\u671f${incomeDelta >= 0 ? '\u589e\u52a0' : '\u51cf\u5c11'} ${Math.abs(incomeDelta).toFixed(0)}%\u3002`,
    });
  }

  return {
    totalExpenseMinor,
    totalIncomeMinor,
    netBalanceMinor,
    topCategoryId: topCategory?.categoryId,
    topCategoryName: topCategory?.name,
    comparisonExpenseDeltaPct: expenseDelta,
    comparisonIncomeDeltaPct: incomeDelta,
    topCategories: topCategories.slice(0, 5),
    insights: insights.slice(0, 4),
    transactionCount: transactions.length,
  };
}
