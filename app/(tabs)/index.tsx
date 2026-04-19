import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheetModal } from '@/components/BottomSheetModal';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { MetricCard } from '@/components/MetricCard';
import { PendingRecurringCard } from '@/components/PendingRecurringCard';
import { SectionTransactionList } from '@/components/SectionTransactionList';
import { elevation, palette, radius, spacing } from '@/constants/theme';
import { buildDraftFromPendingRecurring, markRecurringOccurrenceSkipped } from '@/data/recurringService';
import { formatMonthLabel, monthKey } from '@/domain/dateRange';
import { formatCurrency } from '@/domain/money';
import { LedgerFilters, TransactionType } from '@/domain/types';
import { useLedgerData } from '@/features/ledger/useLedgerData';
import { useCategories } from '@/hooks/useCategories';
import { useAppStore } from '@/store/useAppStore';

type FilterDraft = {
  keyword: string;
  monthKey?: string;
  categoryId?: string;
  transactionType?: TransactionType;
};

const transactionTypeOptions: Array<TransactionType | undefined> = [undefined, 'expense', 'income'];
const emptyFilterDraft: FilterDraft = { keyword: '', monthKey: undefined, categoryId: undefined, transactionType: undefined };
const monthNumberOptions = Array.from({ length: 12 }, (_, index) => index + 1);

function transactionTypeLabel(type?: TransactionType) {
  if (type === 'expense') {
    return '\u652f\u51fa';
  }
  if (type === 'income') {
    return '\u6536\u5165';
  }
  return '\u5168\u90e8';
}

function buildYearOptions(count: number) {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: count }, (_, index) => currentYear - index);
}

function buildMonthKeyValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function parseMonthKeyValue(value?: string) {
  if (!value) {
    const current = new Date();
    return { year: current.getFullYear(), month: current.getMonth() + 1 };
  }

  const [yearText, monthText] = value.split('-');
  return {
    year: Number(yearText),
    month: Number(monthText),
  };
}

export default function LedgerScreen() {
  const [daysVisible, setDaysVisible] = useState(30);
  const [filters, setFilters] = useState<FilterDraft>(emptyFilterDraft);
  const [filterDraft, setFilterDraft] = useState<FilterDraft>(emptyFilterDraft);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [openMonthPicker, setOpenMonthPicker] = useState<'year' | 'month' | null>(null);
  const { categories, categoriesById } = useCategories();
  const openCreate = useAppStore((state) => state.openCreateComposer);
  const openEdit = useAppStore((state) => state.openEditComposer);
  const bumpRefresh = useAppStore((state) => state.bumpRefresh);

  const yearOptions = useMemo(() => buildYearOptions(6), []);

  const appliedFilters = useMemo<LedgerFilters>(
    () => ({
      keyword: filters.keyword,
      monthKey: filters.monthKey,
      categoryId: filters.categoryId,
      transactionType: filters.transactionType,
    }),
    [filters]
  );

  const visibleCategories = useMemo(
    () => categories.filter((category) => !filters.transactionType || category.type === filters.transactionType),
    [categories, filters.transactionType]
  );

  const draftVisibleCategories = useMemo(
    () => categories.filter((category) => !filterDraft.transactionType || category.type === filterDraft.transactionType),
    [categories, filterDraft.transactionType]
  );

  useEffect(() => {
    if (filters.categoryId && !visibleCategories.some((category) => category.id === filters.categoryId)) {
      setFilters((current) => ({ ...current, categoryId: undefined }));
    }
  }, [filters.categoryId, visibleCategories]);

  useEffect(() => {
    if (filterDraft.categoryId && !draftVisibleCategories.some((category) => category.id === filterDraft.categoryId)) {
      setFilterDraft((current) => ({ ...current, categoryId: undefined }));
    }
  }, [draftVisibleCategories, filterDraft.categoryId]);

  const {
    sections,
    pendingItems,
    loading,
    isFiltered,
    hasMore,
    expenseMinor,
    incomeMinor,
    netMinor,
    todayExpenseMinor,
    monthExpenseMinor,
    monthNetMinor,
  } = useLedgerData(daysVisible, appliedFilters);

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];

    if (filters.monthKey) {
      labels.push(formatMonthLabel(filters.monthKey));
    }

    if (filters.transactionType) {
      labels.push(transactionTypeLabel(filters.transactionType));
    }

    if (filters.categoryId) {
      const category = categoriesById[filters.categoryId];
      if (category) {
        labels.push(`${category.icon} ${category.name}`);
      }
    }

    if (filters.keyword.trim()) {
      labels.push(`\u5173\u952e\u5b57 ${filters.keyword.trim()}`);
    }

    return labels;
  }, [categoriesById, filters]);

  const filterCount = activeFilterLabels.length;
  const selectedMonthValue = useMemo(() => parseMonthKeyValue(filterDraft.monthKey), [filterDraft.monthKey]);

  const metricCards = isFiltered ? (
    <>
      <View style={styles.metricRow}>
        <MetricCard title={'\u7b5b\u9009\u652f\u51fa'} value={formatCurrency(expenseMinor)} accent={palette.expense} />
        <MetricCard title={'\u7b5b\u9009\u6536\u5165'} value={formatCurrency(incomeMinor)} accent={palette.income} />
      </View>
      <MetricCard
        title={'\u7b5b\u9009\u51c0\u989d'}
        value={formatCurrency(netMinor)}
        accent={netMinor >= 0 ? palette.income : palette.expense}
      />
    </>
  ) : (
    <>
      <View style={styles.metricRow}>
        <MetricCard title={'\u4eca\u65e5\u652f\u51fa'} value={formatCurrency(todayExpenseMinor)} accent={palette.expense} />
        <MetricCard title={'\u672c\u6708\u652f\u51fa'} value={formatCurrency(monthExpenseMinor)} accent={palette.expense} />
      </View>
      <MetricCard
        title={'\u672c\u6708\u7ed3\u4f59'}
        value={formatCurrency(monthNetMinor)}
        accent={monthNetMinor >= 0 ? palette.income : palette.expense}
      />
    </>
  );

  function openFilterSheet() {
    setFilterDraft(filters);
    setOpenMonthPicker(null);
    setFilterSheetVisible(true);
  }

  function closeFilterSheet() {
    setFilterSheetVisible(false);
    setFilterDraft(filters);
    setOpenMonthPicker(null);
  }

  function resetFilters() {
    setFilters(emptyFilterDraft);
    setFilterDraft(emptyFilterDraft);
    setOpenMonthPicker(null);
  }

  function applyFilters(requestClose?: () => void) {
    setFilters({
      keyword: filterDraft.keyword.trim(),
      monthKey: filterDraft.monthKey,
      categoryId: filterDraft.categoryId,
      transactionType: filterDraft.transactionType,
    });
    setOpenMonthPicker(null);
    if (requestClose) {
      requestClose();
      return;
    }
    setFilterSheetVisible(false);
  }

  function selectDraftYear(year: number) {
    setFilterDraft((current) => {
      const parsed = parseMonthKeyValue(current.monthKey);
      return { ...current, monthKey: buildMonthKeyValue(year, parsed.month) };
    });
    setOpenMonthPicker(null);
  }

  function selectDraftMonth(month: number) {
    setFilterDraft((current) => {
      const parsed = parseMonthKeyValue(current.monthKey);
      return { ...current, monthKey: buildMonthKeyValue(parsed.year, month) };
    });
    setOpenMonthPicker(null);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <SectionTransactionList
          sections={sections}
          categoriesById={categoriesById}
          loading={loading}
          emptyMessage={isFiltered ? '\u6ca1\u6709\u627e\u5230\u5339\u914d\u7684\u8bb0\u5f55' : '\u8fd8\u6ca1\u6709\u4efb\u4f55\u8bb0\u5f55'}
          onPressTransaction={(transaction) => openEdit(transaction.id)}
          onEndReached={() => {
            if (hasMore) {
              setDaysVisible((value) => value + 30);
            }
          }}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.headerText}>
                  <Text style={styles.pageTitle}>{'\u8bb0\u8d26'}</Text>
                </View>
                <Pressable onPress={openFilterSheet} style={({ pressed }) => [styles.filterEntryButton, pressed && styles.surfacePressed]}>
                  <Text style={styles.filterEntryText}>{'\u641c\u7d22\u4e0e\u7b5b\u9009'}</Text>
                  {filterCount > 0 ? (
                    <View style={styles.filterCountBadge}>
                      <Text style={styles.filterCountText}>{String(filterCount)}</Text>
                    </View>
                  ) : null}
                </Pressable>
              </View>

              {filterCount > 0 ? (
                <View style={styles.activeFilterRow}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFilters}>
                    {activeFilterLabels.map((label, index) => (
                      <View key={`${label}_${index}`} style={styles.activeFilterTag}>
                        <Text style={styles.activeFilterText}>{label}</Text>
                      </View>
                    ))}
                  </ScrollView>
                  <Pressable onPress={resetFilters} style={({ pressed }) => [styles.inlineClearButton, pressed && styles.surfacePressed]}>
                    <Text style={styles.inlineClearButtonText}>{'\u6e05\u7a7a'}</Text>
                  </Pressable>
                </View>
              ) : null}

              {!isFiltered && pendingItems.length > 0 ? (
                <PendingRecurringCard
                  items={pendingItems}
                  onConfirm={(item) =>
                    openCreate({
                      draft: buildDraftFromPendingRecurring(item),
                      source: 'recurring',
                      sourceRefId: item.rule.id,
                      recurringOccurrenceId: item.occurrence.id,
                    })
                  }
                  onSkip={async (item) => {
                    await markRecurringOccurrenceSkipped(item.occurrence.id);
                    bumpRefresh();
                  }}
                />
              ) : null}

              {metricCards}
            </View>
          }
        />
        <FloatingActionButton onPress={() => openCreate()} />
      </View>

      <BottomSheetModal visible={filterSheetVisible} onClose={closeFilterSheet} sheetStyle={styles.sheet}>
        {({ requestClose }) => (
          <>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle}>{'\u641c\u7d22\u4e0e\u7b5b\u9009'}</Text>
              </View>
              <Pressable onPress={requestClose} style={({ pressed }) => [styles.sheetCloseButton, pressed && styles.surfacePressed]}>
                <Text style={styles.sheetCloseText}>{'\u53d6\u6d88'}</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>{'\u5173\u952e\u5b57'}</Text>
                <TextInput
                  value={filterDraft.keyword}
                  onChangeText={(keyword) => setFilterDraft((current) => ({ ...current, keyword }))}
                  placeholder={'\u641c\u7d22\u5907\u6ce8\u3001\u5546\u5bb6\u6216\u5206\u7c7b'}
                  placeholderTextColor={palette.textMuted}
                  style={styles.searchInput}
                />
              </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>{'\u6708\u4efd'}</Text>
            <View style={styles.monthSelectorRow}>
              <Pressable
                onPress={() => {
                  setFilterDraft((current) => ({ ...current, monthKey: undefined }));
                  setOpenMonthPicker(null);
                }}
                style={({ pressed }) => [styles.monthAllButton, !filterDraft.monthKey && styles.monthAllButtonSelected, pressed && styles.surfacePressed]}>
                <Text style={[styles.monthAllText, !filterDraft.monthKey && styles.monthAllTextSelected]}>{'\u5168\u90e8'}</Text>
              </Pressable>
              <Pressable
                onPress={() => setOpenMonthPicker((current) => (current === 'year' ? null : 'year'))}
                style={({ pressed }) => [styles.dropdownField, openMonthPicker === 'year' && styles.dropdownFieldActive, pressed && styles.surfacePressed]}>
                <Text style={styles.dropdownFieldText}>{`${selectedMonthValue.year}\u5e74`}</Text>
                <Text style={styles.dropdownFieldIcon}>{'\u2304'}</Text>
              </Pressable>
              <Pressable
                onPress={() => setOpenMonthPicker((current) => (current === 'month' ? null : 'month'))}
                style={({ pressed }) => [styles.dropdownField, openMonthPicker === 'month' && styles.dropdownFieldActive, pressed && styles.surfacePressed]}>
                <Text style={styles.dropdownFieldText}>{`${selectedMonthValue.month}\u6708`}</Text>
                <Text style={styles.dropdownFieldIcon}>{'\u2304'}</Text>
              </Pressable>
            </View>
            {openMonthPicker ? (
              <View style={styles.dropdownMenu}>
                <View style={styles.dropdownMenuHeader}>
                  <Text style={styles.dropdownMenuTitle}>{openMonthPicker === 'year' ? '\u9009\u62e9\u5e74\u4efd' : '\u9009\u62e9\u6708\u4efd'}</Text>
                  <Pressable onPress={() => setOpenMonthPicker(null)}>
                    <Text style={styles.dropdownMenuClose}>{'\u6536\u8d77'}</Text>
                  </Pressable>
                </View>
                <View style={styles.dropdownOptions}>
                  {(openMonthPicker === 'year' ? yearOptions : monthNumberOptions).map((item) => {
                    const selected = openMonthPicker === 'year' ? selectedMonthValue.year === item : selectedMonthValue.month === item;
                    return (
                      <Pressable
                        key={`${openMonthPicker}_${item}`}
                        onPress={() => {
                          if (openMonthPicker === 'year') {
                            selectDraftYear(item);
                            return;
                          }
                          selectDraftMonth(item);
                        }}
                        style={({ pressed }) => [styles.dropdownOption, selected && styles.dropdownOptionSelected, pressed && styles.surfacePressed]}>
                        <Text style={[styles.dropdownOptionText, selected && styles.dropdownOptionTextSelected]}>
                          {openMonthPicker === 'year' ? `${item}\u5e74` : `${item}\u6708`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>{'\u7c7b\u578b'}</Text>
            <View style={styles.inlineFilters}>
              {transactionTypeOptions.map((item) => {
                const selected = filterDraft.transactionType === item;
                return (
                  <Pressable
                    key={item ?? 'all'}
                    onPress={() => setFilterDraft((current) => ({ ...current, transactionType: item }))}
                    style={({ pressed }) => [styles.inlineChip, selected && styles.inlineChipSelected, pressed && styles.surfacePressed]}>
                    <Text style={[styles.inlineChipText, selected && styles.inlineChipTextSelected]}>{transactionTypeLabel(item)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>{'\u5206\u7c7b'}</Text>
            <View style={styles.categoryWrap}>
              <Pressable
                onPress={() => setFilterDraft((current) => ({ ...current, categoryId: undefined }))}
                style={({ pressed }) => [styles.categoryChip, !filterDraft.categoryId && styles.inlineChipSelected, pressed && styles.surfacePressed]}>
                <Text style={[styles.categoryText, !filterDraft.categoryId && styles.inlineChipTextSelected]}>{'\u5168\u90e8\u5206\u7c7b'}</Text>
              </Pressable>
              {draftVisibleCategories.map((category) => {
                const selected = filterDraft.categoryId === category.id;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => setFilterDraft((current) => ({ ...current, categoryId: category.id }))}
                    style={({ pressed }) => [
                      styles.categoryChip,
                      selected && { backgroundColor: category.color, borderColor: category.color },
                      pressed && styles.surfacePressed,
                    ]}>
                    <Text style={[styles.categoryText, selected && styles.inlineChipTextSelected]}>
                      {category.icon} {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
            </ScrollView>

            <View style={styles.sheetFooter}>
              <Pressable
                onPress={() => {
                  setFilterDraft(emptyFilterDraft);
                  setOpenMonthPicker(null);
                }}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.surfacePressed]}>
                <Text style={styles.secondaryButtonText}>{'\u91cd\u7f6e'}</Text>
              </Pressable>
              <Pressable onPress={() => applyFilters(requestClose)} style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
                <Text style={styles.primaryButtonText}>{'\u5e94\u7528\u7b5b\u9009'}</Text>
              </Pressable>
            </View>
          </>
        )}
      </BottomSheetModal>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: { flex: 1, gap: 4 },
  pageTitle: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800',
  },
  filterEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  filterEntryText: {
    color: palette.text,
    fontWeight: '700',
  },
  filterCountBadge: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: palette.primaryMuted,
    alignItems: 'center',
  },
  filterCountText: {
    color: palette.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activeFilters: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  activeFilterTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  activeFilterText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '600',
  },
  inlineClearButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.expenseMuted,
  },
  inlineClearButtonText: {
    color: palette.expense,
    fontSize: 12,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sheet: {
    height: '74%',
    backgroundColor: palette.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sheetHeaderText: { flex: 1, gap: 4 },
  sheetTitle: { color: palette.text, fontSize: 20, fontWeight: '800' },
  sheetCloseButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  sheetCloseText: { color: palette.text, fontWeight: '700', fontSize: 13 },
  sheetContent: { gap: spacing.md, paddingBottom: spacing.md },
  filterSection: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...elevation.card,
  },
  filterSectionTitle: { color: palette.text, fontSize: 15, fontWeight: '700' },
  searchInput: {
    backgroundColor: palette.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: palette.text,
  },
  monthSelectorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  monthAllButton: {
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  monthAllButtonSelected: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  monthAllText: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  monthAllTextSelected: {
    color: '#FFFFFF',
  },
  dropdownField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  dropdownFieldActive: {
    borderColor: palette.primary,
    backgroundColor: palette.primaryMuted,
  },
  dropdownFieldText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownFieldIcon: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  dropdownMenu: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceSoft,
    padding: spacing.md,
    gap: spacing.sm,
  },
  dropdownMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  dropdownMenuTitle: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownMenuClose: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  dropdownOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dropdownOption: {
    minWidth: '30%',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
  },
  dropdownOptionSelected: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  dropdownOptionText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownOptionTextSelected: {
    color: '#FFFFFF',
  },
  inlineFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  inlineChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inlineChipSelected: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  inlineChipText: {
    color: palette.textMuted,
    fontWeight: '600',
  },
  inlineChipTextSelected: {
    color: '#FFFFFF',
  },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryChip: {
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  categoryText: { color: palette.text, fontWeight: '600' },
  sheetFooter: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  secondaryButton: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryButtonText: { color: palette.text, fontWeight: '700' },
  primaryButton: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  surfacePressed: { opacity: 0.82 },
  primaryButtonPressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
});

