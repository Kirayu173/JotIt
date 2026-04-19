import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FloatingActionButton } from '@/components/FloatingActionButton';
import { MetricCard } from '@/components/MetricCard';
import { SectionTransactionList } from '@/components/SectionTransactionList';
import { palette, spacing } from '@/constants/theme';
import { formatCurrency } from '@/domain/money';
import { useLedgerData } from '@/features/ledger/useLedgerData';
import { useCategories } from '@/hooks/useCategories';
import { useAppStore } from '@/store/useAppStore';

export default function LedgerScreen() {
  const [daysVisible, setDaysVisible] = useState(30);
  const { categoriesById } = useCategories();
  const openCreate = useAppStore((state) => state.openCreateComposer);
  const openEdit = useAppStore((state) => state.openEditComposer);
  const { sections, loading, hasMore, todayExpenseMinor, monthExpenseMinor, monthNetMinor } = useLedgerData(daysVisible);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <SectionTransactionList
          sections={sections}
          categoriesById={categoriesById}
          loading={loading}
          emptyMessage={'\u8fd8\u6ca1\u6709\u4efb\u4f55\u8bb0\u5f55'}
          onPressTransaction={(transaction) => openEdit(transaction.id)}
          onEndReached={() => {
            if (hasMore) {
              setDaysVisible((value) => value + 30);
            }
          }}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.pageTitle}>{'\u8bb0\u8d26'}</Text>
              <View style={styles.metricRow}>
                <MetricCard title={'\u4eca\u65e5\u652f\u51fa'} value={formatCurrency(todayExpenseMinor)} accent={palette.expense} />
                <MetricCard title={'\u672c\u6708\u652f\u51fa'} value={formatCurrency(monthExpenseMinor)} accent={palette.expense} />
              </View>
              <MetricCard
                title={'\u672c\u6708\u7ed3\u4f59'}
                value={formatCurrency(monthNetMinor)}
                accent={monthNetMinor >= 0 ? palette.income : palette.expense}
              />
            </View>
          }
        />
        <FloatingActionButton onPress={openCreate} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  container: { flex: 1, backgroundColor: palette.background },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  pageTitle: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800',
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
