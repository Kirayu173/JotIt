import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryBreakdownCard } from '@/components/CategoryBreakdownCard';
import { MetricCard } from '@/components/MetricCard';
import { PeriodPicker } from '@/components/PeriodPicker';
import { SummaryCard } from '@/components/SummaryCard';
import { TransactionRow } from '@/components/TransactionRow';
import { palette, spacing } from '@/constants/theme';
import { canShiftForward, shiftAnchorDate } from '@/domain/dateRange';
import { formatCurrency } from '@/domain/money';
import { ReviewPeriod } from '@/domain/types';
import { useReviewData } from '@/features/review/useReviewData';
import { useAppStore } from '@/store/useAppStore';

export default function ReviewScreen() {
  const [period, setPeriod] = useState<ReviewPeriod>('month');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [customStart, setCustomStart] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [customEnd, setCustomEnd] = useState(new Date());
  const openEdit = useAppStore((state) => state.openEditComposer);
  const { range, loading, summary, categoriesById, sections } = useReviewData(period, anchorDate, customStart, customEnd);
  const canNext = useMemo(() => canShiftForward(period, anchorDate), [anchorDate, period]);

  function shiftPeriod(direction: 'prev' | 'next') {
    setAnchorDate((current) => shiftAnchorDate(period, current, direction));
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>{'\u56de\u987e'}</Text>
          <PeriodPicker
            value={period}
            onChange={(next) => setPeriod(next)}
            label={range.label}
            canGoNext={canNext}
            onPrev={() => shiftPeriod('prev')}
            onNext={() => {
              if (canNext) {
                shiftPeriod('next');
              }
            }}
            onPickCustomStart={() => {
              DateTimePickerAndroid.open({
                value: customStart,
                mode: 'date',
                onChange: (_, value) => value && setCustomStart(value),
              });
            }}
            onPickCustomEnd={() => {
              DateTimePickerAndroid.open({
                value: customEnd,
                mode: 'date',
                onChange: (_, value) => value && setCustomEnd(value),
              });
            }}
            customStartLabel={customStart.toLocaleDateString('zh-CN')}
            customEndLabel={customEnd.toLocaleDateString('zh-CN')}
          />
        </View>

        <View style={styles.bodyStage}>
          <ScrollView contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={palette.primary} />
              </View>
            ) : (
              <>
                <View style={styles.metricRow}>
                  <MetricCard title={'\u603b\u652f\u51fa'} value={formatCurrency(summary?.totalExpenseMinor ?? 0)} accent={palette.expense} />
                  <MetricCard title={'\u603b\u6536\u5165'} value={formatCurrency(summary?.totalIncomeMinor ?? 0)} accent={palette.income} />
                </View>
                <View style={styles.metricRow}>
                  <MetricCard
                    title={'\u51c0\u7ed3\u4f59'}
                    value={formatCurrency(summary?.netBalanceMinor ?? 0)}
                    accent={(summary?.netBalanceMinor ?? 0) >= 0 ? palette.income : palette.expense}
                  />
                  <MetricCard title={'\u6700\u9ad8\u652f\u51fa\u5206\u7c7b'} value={summary?.topCategoryName ?? '\u6682\u65e0'} />
                </View>
                <View style={styles.fullWidthBlock}>
                  <SummaryCard insights={summary?.insights ?? []} />
                </View>
                <View style={styles.fullWidthBlock}>
                  <CategoryBreakdownCard items={summary?.topCategories ?? []} />
                </View>

                {sections.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>{'\u5f53\u524d\u65f6\u95f4\u8303\u56f4\u6ca1\u6709\u8bb0\u5f55'}</Text>
                  </View>
                ) : (
                  sections.map((section) => (
                    <View key={section.dateKey} style={styles.sectionBlock}>
                      <Text style={styles.sectionTitle}>{section.title}</Text>
                      <View style={styles.sectionList}>
                        {section.data.map((transaction) => (
                          <TransactionRow
                            key={transaction.id}
                            transaction={transaction}
                            category={categoriesById[transaction.categoryId]}
                            onPress={() => openEdit(transaction.id)}
                          />
                        ))}
                      </View>
                    </View>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  container: { flex: 1, backgroundColor: palette.background },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.md },
  pageTitle: { color: palette.text, fontSize: 28, fontWeight: '800' },
  bodyStage: { flex: 1, marginTop: spacing.md },
  bodyContent: { paddingBottom: 120, gap: spacing.md },
  metricRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.md },
  fullWidthBlock: { marginHorizontal: spacing.md },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120 },
  emptyState: {
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  emptyText: { color: palette.textMuted, fontSize: 14 },
  sectionBlock: { gap: spacing.sm },
  sectionTitle: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  sectionList: { gap: spacing.sm },
});

