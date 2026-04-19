import { useEffect, useMemo, useState } from 'react';

import { getPendingRecurringItems, PendingRecurringItem } from '@/data/recurringService';
import { transactionRepository } from '@/data/repositories/transactionRepository';
import { defaultAppSettings } from '@/data/settings';
import { endOfDay, monthKey, monthKeyFromIso, startOfDay, subtractDays, todayDateKey, toDateKey } from '@/domain/dateRange';
import { groupTransactionsByDay } from '@/domain/list';
import { LedgerFilters, TransactionRecord } from '@/domain/types';
import { useAppStore } from '@/store/useAppStore';

function hasActiveFilters(filters: LedgerFilters) {
  return Boolean(filters.monthKey || filters.categoryId || filters.transactionType || filters.keyword?.trim());
}

export function useLedgerData(daysVisible: number, filters: LedgerFilters) {
  const ready = useAppStore((state) => state.ready);
  const refreshKey = useAppStore((state) => state.refreshKey);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingRecurringItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isFiltered = hasActiveFilters(filters);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!ready) return;
      setLoading(true);

      const transactionPromise = isFiltered
        ? transactionRepository.search(filters)
        : (() => {
            const cappedDays = Math.min(daysVisible, defaultAppSettings.ledgerWindowDays);
            const end = endOfDay(new Date());
            const start = startOfDay(subtractDays(new Date(), cappedDays));
            return transactionRepository.listBetween(start.toISOString(), end.toISOString());
          })();

      const [items, nextPendingItems] = await Promise.all([transactionPromise, getPendingRecurringItems()]);

      if (active) {
        setTransactions(items);
        setPendingItems(nextPendingItems);
        setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [daysVisible, filters, isFiltered, ready, refreshKey]);

  const sections = useMemo(() => groupTransactionsByDay(transactions), [transactions]);

  const totals = useMemo(() => {
    const expenseMinor = transactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amountMinor, 0);
    const incomeMinor = transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amountMinor, 0);
    return {
      expenseMinor,
      incomeMinor,
      netMinor: incomeMinor - expenseMinor,
    };
  }, [transactions]);

  const currentMonthKey = monthKey(new Date());
  const monthTransactions = useMemo(
    () => transactions.filter((item) => monthKeyFromIso(item.occurredAt) === currentMonthKey),
    [currentMonthKey, transactions]
  );
  const todayExpenseMinor = useMemo(
    () =>
      transactions
        .filter((item) => item.type === 'expense' && toDateKey(item.occurredAt) === todayDateKey())
        .reduce((sum, item) => sum + item.amountMinor, 0),
    [transactions]
  );
  const monthExpenseMinor = useMemo(
    () =>
      monthTransactions
        .filter((item) => item.type === 'expense')
        .reduce((sum, item) => sum + item.amountMinor, 0),
    [monthTransactions]
  );
  const monthIncomeMinor = useMemo(
    () =>
      monthTransactions
        .filter((item) => item.type === 'income')
        .reduce((sum, item) => sum + item.amountMinor, 0),
    [monthTransactions]
  );

  return {
    sections,
    pendingItems,
    loading,
    isFiltered,
    hasMore: !isFiltered && daysVisible < defaultAppSettings.ledgerWindowDays,
    expenseMinor: totals.expenseMinor,
    incomeMinor: totals.incomeMinor,
    netMinor: totals.netMinor,
    todayExpenseMinor,
    monthExpenseMinor,
    monthIncomeMinor,
    monthNetMinor: monthIncomeMinor - monthExpenseMinor,
    transactionCount: transactions.length,
  };
}
