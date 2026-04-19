import { useEffect, useMemo, useState } from 'react';

import { transactionRepository } from '@/data/repositories/transactionRepository';
import { defaultAppSettings } from '@/data/settings';
import { dateToKey, endOfDay, monthKey, monthKeyFromIso, startOfDay, subtractDays, toDateKey } from '@/domain/dateRange';
import { groupTransactionsByDay } from '@/domain/list';
import { TransactionRecord } from '@/domain/types';
import { useAppStore } from '@/store/useAppStore';

export function useLedgerData(daysVisible: number) {
  const ready = useAppStore((state) => state.ready);
  const refreshKey = useAppStore((state) => state.refreshKey);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!ready) return;
      setLoading(true);
      const cappedDays = Math.min(daysVisible, defaultAppSettings.ledgerWindowDays);
      const end = endOfDay(new Date());
      const start = startOfDay(subtractDays(new Date(), cappedDays));
      const items = await transactionRepository.listBetween(start.toISOString(), end.toISOString());
      if (active) {
        setTransactions(items);
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [daysVisible, ready, refreshKey]);

  const sections = useMemo(() => groupTransactionsByDay(transactions), [transactions]);
  const todayKey = dateToKey(new Date());
  const currentMonthKey = monthKey(new Date());
  const todayExpenseMinor = transactions
    .filter((item) => item.type === 'expense' && toDateKey(item.occurredAt) === todayKey)
    .reduce((sum, item) => sum + item.amountMinor, 0);
  const monthTransactions = transactions.filter((item) => monthKeyFromIso(item.occurredAt) === currentMonthKey);
  const monthExpenseMinor = monthTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amountMinor, 0);
  const monthIncomeMinor = monthTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amountMinor, 0);

  return {
    sections,
    loading,
    hasMore: daysVisible < defaultAppSettings.ledgerWindowDays,
    todayExpenseMinor,
    monthExpenseMinor,
    monthIncomeMinor,
    monthNetMinor: monthIncomeMinor - monthExpenseMinor,
  };
}
