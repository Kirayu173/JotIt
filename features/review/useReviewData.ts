import { useEffect, useMemo, useState } from 'react';

import { transactionRepository } from '@/data/repositories/transactionRepository';
import { buildDateRange, getPreviousComparableRange } from '@/domain/dateRange';
import { groupTransactionsByDay } from '@/domain/list';
import { buildSummaryResult } from '@/domain/summary';
import { ReviewPeriod, SummaryResult, TransactionRecord } from '@/domain/types';
import { useCategories } from '@/hooks/useCategories';
import { useAppStore } from '@/store/useAppStore';

export function useReviewData(period: ReviewPeriod, anchorDate: Date, customStart: Date, customEnd: Date) {
  const ready = useAppStore((state) => state.ready);
  const refreshKey = useAppStore((state) => state.refreshKey);
  const { categories, categoriesById } = useCategories();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => buildDateRange(period, anchorDate, customStart, customEnd), [period, anchorDate, customStart, customEnd]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!ready || categories.length === 0) return;
      setLoading(true);
      const previousRange = getPreviousComparableRange(range);
      const [currentTransactions, previousTransactions] = await Promise.all([
        transactionRepository.listBetween(range.start.toISOString(), range.end.toISOString()),
        transactionRepository.listBetween(previousRange.start.toISOString(), previousRange.end.toISOString()),
      ]);
      if (active) {
        setTransactions(currentTransactions);
        setSummary(buildSummaryResult(currentTransactions, categories, previousTransactions));
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [categories, period, range, ready, refreshKey]);

  return {
    range,
    loading,
    summary,
    categoriesById,
    sections: groupTransactionsByDay(transactions),
  };
}
