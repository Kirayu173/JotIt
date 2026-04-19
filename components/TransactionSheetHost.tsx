import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheetModal } from '@/components/BottomSheetModal';
import { palette, radius, spacing } from '@/constants/theme';
import { recurringOccurrenceRepository } from '@/data/repositories/recurringOccurrenceRepository';
import { transactionRepository } from '@/data/repositories/transactionRepository';
import { refreshClosedMonthlySnapshots } from '@/data/summarySync';
import { nowIso, toDateOnlyIso } from '@/domain/dateRange';
import { parseAmountInputToMinor } from '@/domain/money';
import { Category, TransactionDraft, TransactionRecord, TransactionType } from '@/domain/types';
import { useCategories } from '@/hooks/useCategories';
import { useAppStore } from '@/store/useAppStore';

const createEmptyDraft = (): TransactionDraft => ({
  type: 'expense',
  amountInput: '',
  categoryId: '',
  note: '',
  occurredAt: toDateOnlyIso(new Date()),
});

function findDefaultCategory(type: TransactionType, categories: Category[]): string {
  return categories.find((category) => category.type === type)?.id ?? '';
}

function buildCategorySuggestions(items: TransactionRecord[], type: TransactionType): string[] {
  const score = new Map<string, number>();
  items
    .filter((item) => item.type === type)
    .forEach((item) => score.set(item.categoryId, (score.get(item.categoryId) ?? 0) + 1));
  return [...score.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([categoryId]) => categoryId);
}

function buildAmountSuggestions(items: TransactionRecord[], type: TransactionType): string[] {
  const score = new Map<string, number>();
  items
    .filter((item) => item.type === type)
    .forEach((item) => {
      const key = (item.amountMinor / 100).toFixed(2);
      score.set(key, (score.get(key) ?? 0) + 1);
    });
  return [...score.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([amount]) => amount);
}

export function TransactionSheetHost() {
  const { categories } = useCategories();
  const composer = useAppStore((state) => state.composer);
  const closeComposer = useAppStore((state) => state.closeComposer);
  const bumpRefresh = useAppStore((state) => state.bumpRefresh);
  const setUndoCandidate = useAppStore((state) => state.setUndoCandidate);
  const [draft, setDraft] = useState<TransactionDraft>(createEmptyDraft());
  const [editingRecord, setEditingRecord] = useState<TransactionRecord | null>(null);
  const [suggestedCategoryIds, setSuggestedCategoryIds] = useState<string[]>([]);
  const [suggestedAmounts, setSuggestedAmounts] = useState<string[]>([]);

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === draft.type),
    [categories, draft.type]
  );

  const suggestedCategories = useMemo(
    () =>
      suggestedCategoryIds
        .map((categoryId) => categories.find((category) => category.id === categoryId))
        .filter((category): category is Category => Boolean(category)),
    [categories, suggestedCategoryIds]
  );

  const canSave = useMemo(
    () => Boolean(draft.categoryId) && parseAmountInputToMinor(draft.amountInput) > 0,
    [draft.amountInput, draft.categoryId]
  );

  useEffect(() => {
    let active = true;

    async function loadComposer() {
      if (!composer.visible) {
        setEditingRecord(null);
        setDraft(createEmptyDraft());
        setSuggestedCategoryIds([]);
        setSuggestedAmounts([]);
        return;
      }

      if (composer.transactionId) {
        const transaction = await transactionRepository.getById(composer.transactionId);
        if (transaction && active) {
          setEditingRecord(transaction);
          setDraft({
            id: transaction.id,
            type: transaction.type,
            amountInput: String(transaction.amountMinor / 100),
            categoryId: transaction.categoryId,
            note: transaction.note ?? '',
            occurredAt: transaction.occurredAt,
          });
          return;
        }
      }

      const baseDraft = createEmptyDraft();
      const initialDraft = composer.initialDraft ?? {};
      const nextType = initialDraft.type ?? baseDraft.type;
      const nextCategoryId =
        initialDraft.categoryId && categories.some((category) => category.id === initialDraft.categoryId)
          ? initialDraft.categoryId
          : findDefaultCategory(nextType, categories);

      if (active) {
        setEditingRecord(null);
        setDraft({
          ...baseDraft,
          ...initialDraft,
          type: nextType,
          categoryId: nextCategoryId,
          occurredAt: initialDraft.occurredAt ?? baseDraft.occurredAt,
        });
      }
    }

    loadComposer();

    return () => {
      active = false;
    };
  }, [categories, composer.initialDraft, composer.transactionId, composer.visible]);

  useEffect(() => {
    if (!composer.visible || editingRecord) {
      return;
    }
    if (!draft.categoryId && filteredCategories.length > 0) {
      setDraft((current) => ({ ...current, categoryId: filteredCategories[0].id }));
    }
  }, [composer.visible, draft.categoryId, editingRecord, filteredCategories]);

  useEffect(() => {
    let active = true;

    async function loadSuggestions() {
      if (!composer.visible || editingRecord) {
        setSuggestedCategoryIds([]);
        setSuggestedAmounts([]);
        return;
      }

      const recentTransactions = await transactionRepository.listRecent(40, draft.type);
      if (!active) {
        return;
      }

      setSuggestedCategoryIds(buildCategorySuggestions(recentTransactions, draft.type));
      setSuggestedAmounts(buildAmountSuggestions(recentTransactions, draft.type));
    }

    loadSuggestions();

    return () => {
      active = false;
    };
  }, [composer.visible, draft.type, editingRecord]);

  const saveRecord = async (closeAfterSave: boolean, requestClose?: () => void) => {
    const amountMinor = parseAmountInputToMinor(draft.amountInput);
    if (!draft.categoryId || amountMinor <= 0) {
      return;
    }

    const timestamp = nowIso();
    const payload: TransactionRecord = {
      id: editingRecord?.id ?? `txn_${Date.now()}`,
      type: draft.type,
      amountMinor,
      currency: 'CNY',
      categoryId: draft.categoryId,
      note: draft.note.trim() || null,
      merchant: null,
      occurredAt: toDateOnlyIso(draft.occurredAt),
      source: editingRecord?.source ?? composer.source ?? 'manual',
      sourceRefId: editingRecord?.sourceRefId ?? composer.sourceRefId ?? null,
      createdAt: editingRecord?.createdAt ?? timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };

    if (editingRecord) {
      await transactionRepository.update(payload);
    } else {
      await transactionRepository.create(payload);
      if (composer.recurringOccurrenceId) {
        await recurringOccurrenceRepository.markConfirmed(composer.recurringOccurrenceId, payload.id, timestamp);
      }
    }

    await refreshClosedMonthlySnapshots();
    bumpRefresh();

    if (closeAfterSave || editingRecord || composer.recurringOccurrenceId) {
      if (requestClose) {
        requestClose();
      } else {
        closeComposer();
      }
      return;
    }

    setDraft((current) => ({
      ...current,
      amountInput: '',
      note: '',
      occurredAt: toDateOnlyIso(new Date()),
    }));
  };

  const deleteRecord = async (requestClose?: () => void) => {
    if (!editingRecord) {
      return;
    }
    const deletedAt = nowIso();
    await transactionRepository.softDelete(editingRecord.id, deletedAt);
    await refreshClosedMonthlySnapshots();
    setUndoCandidate({ ...editingRecord, deletedAt });
    bumpRefresh();
    if (requestClose) {
      requestClose();
      return;
    }
    closeComposer();
  };

  const title = editingRecord
    ? '\u7f16\u8f91\u8bb0\u5f55'
    : composer.recurringOccurrenceId
      ? '\u786e\u8ba4\u5468\u671f\u8bb0\u5f55'
      : '\u65b0\u5efa\u8bb0\u5f55';

  const primaryLabel = composer.recurringOccurrenceId ? '\u786e\u8ba4\u5165\u8d26' : editingRecord ? '\u4fdd\u5b58\u4fee\u6539' : '\u4fdd\u5b58';

  return (
    <BottomSheetModal visible={composer.visible} onClose={closeComposer} sheetStyle={styles.sheet}>
      {({ requestClose }) => (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={requestClose}>
              <Text style={styles.link}>{'\u5173\u95ed'}</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.toggleRow}>
              {(['expense', 'income'] as const).map((type) => {
                const selected = draft.type === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => {
                      const nextCategoryId = findDefaultCategory(type, categories);
                      setDraft((current) => ({ ...current, type, categoryId: nextCategoryId }));
                    }}
                    style={({ pressed }) => [styles.toggleChip, selected && styles.toggleChipSelected, pressed && styles.surfacePressed]}>
                    <Text style={[styles.toggleText, selected && styles.toggleTextSelected]}>
                      {type === 'expense' ? '\u652f\u51fa' : '\u6536\u5165'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

        <View style={styles.amountCard}>
          <Text style={styles.fieldLabel}>{'\u91d1\u989d'}</Text>
          <TextInput
            value={draft.amountInput}
            onChangeText={(value) => setDraft((current) => ({ ...current, amountInput: value.replace(/[^\d.]/g, '') }))}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={palette.textMuted}
            style={styles.amountInput}
          />
          {!editingRecord && suggestedAmounts.length > 0 ? (
            <View style={styles.suggestionWrap}>
              {suggestedAmounts.map((amount) => {
                const selected = draft.amountInput === amount;
                return (
                  <Pressable
                    key={amount}
                    onPress={() => setDraft((current) => ({ ...current, amountInput: amount }))}
                    style={({ pressed }) => [styles.suggestionChip, selected && styles.suggestionChipSelected, pressed && styles.surfacePressed]}>
                    <Text style={[styles.suggestionText, selected && styles.suggestionTextSelected]}>{amount}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>{'\u5206\u7c7b'}</Text>
          {!editingRecord && suggestedCategories.length > 0 ? (
            <View style={styles.suggestionWrap}>
              {suggestedCategories.map((category) => {
                const selected = draft.categoryId === category.id;
                return (
                  <Pressable
                    key={`suggested_${category.id}`}
                    onPress={() => setDraft((current) => ({ ...current, categoryId: category.id }))}
                    style={({ pressed }) => [
                      styles.suggestionChip,
                      selected && { backgroundColor: category.color, borderColor: category.color },
                      pressed && styles.surfacePressed,
                    ]}>
                    <Text style={[styles.suggestionText, selected && styles.suggestionTextSelected]}>
                      {category.icon} {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <View style={styles.categoryWrap}>
            {filteredCategories.map((category) => {
              const selected = draft.categoryId === category.id;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => setDraft((current) => ({ ...current, categoryId: category.id }))}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    selected && { backgroundColor: category.color, borderColor: category.color },
                    pressed && styles.surfacePressed,
                  ]}>
                  <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>
                    {category.icon} {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>{'\u5907\u6ce8'}</Text>
          <TextInput
            value={draft.note}
            onChangeText={(note) => setDraft((current) => ({ ...current, note }))}
            placeholder={'\u5199\u70b9\u5907\u6ce8\uff0c\u65b9\u4fbf\u4ee5\u540e\u56de\u770b'}
            placeholderTextColor={palette.textMuted}
            style={styles.noteInput}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>{'\u65e5\u671f'}</Text>
          <Pressable
            style={({ pressed }) => [styles.datetimeButton, pressed && styles.surfacePressed]}
            onPress={() => {
              DateTimePickerAndroid.open({
                value: new Date(draft.occurredAt),
                mode: 'date',
                onChange: (_, value) => {
                  if (!value) return;
                  setDraft((current) => ({ ...current, occurredAt: toDateOnlyIso(value) }));
                },
              });
            }}>
            <Text style={styles.datetimeText}>{new Date(draft.occurredAt).toLocaleDateString('zh-CN')}</Text>
          </Pressable>
        </View>
          </ScrollView>

          <View style={styles.footer}>
            {editingRecord ? (
              <>
                <Pressable onPress={() => deleteRecord(requestClose)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.surfacePressed]}>
                  <Text style={[styles.secondaryButtonText, styles.deleteText]}>{'\u5220\u9664'}</Text>
                </Pressable>
                <Pressable
                  onPress={() => saveRecord(true, requestClose)}
                  disabled={!canSave}
                  style={({ pressed }) => [styles.primaryButton, !canSave && styles.buttonDisabled, pressed && canSave && styles.primaryButtonPressed]}>
                  <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
                </Pressable>
              </>
            ) : (
              <>
                {!composer.recurringOccurrenceId ? (
                  <Pressable
                    onPress={() => saveRecord(false)}
                    disabled={!canSave}
                    style={({ pressed }) => [styles.secondaryButton, !canSave && styles.buttonDisabled, pressed && canSave && styles.surfacePressed]}>
                    <Text style={styles.secondaryButtonText}>{'\u4fdd\u5b58\u5e76\u7ee7\u7eed'}</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => saveRecord(true, requestClose)}
                  disabled={!canSave}
                  style={({ pressed }) => [styles.primaryButton, !canSave && styles.buttonDisabled, pressed && canSave && styles.primaryButtonPressed]}>
                  <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
                </Pressable>
              </>
            )}
          </View>
        </>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    height: '76%',
    backgroundColor: palette.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
  },
  link: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  content: { gap: spacing.md, paddingBottom: spacing.md },
  toggleRow: { flexDirection: 'row', gap: spacing.sm },
  toggleChip: {
    flex: 1,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceMuted,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleChipSelected: { backgroundColor: palette.primary, borderColor: palette.primary },
  toggleText: { color: palette.textMuted, fontWeight: '700' },
  toggleTextSelected: { color: '#FFFFFF' },
  amountCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  fieldLabel: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  amountInput: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '800',
    paddingVertical: 4,
  },
  section: { gap: spacing.sm },
  suggestionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  suggestionChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: palette.primaryMuted,
    borderWidth: 1,
    borderColor: palette.primaryMuted,
  },
  suggestionChipSelected: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  suggestionText: {
    color: palette.primary,
    fontWeight: '700',
  },
  suggestionTextSelected: {
    color: '#FFFFFF',
  },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryChip: {
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  categoryText: { color: palette.text, fontWeight: '600' },
  categoryTextSelected: { color: '#FFFFFF' },
  noteInput: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.md,
    color: palette.text,
  },
  datetimeButton: {
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  datetimeText: { color: palette.text, fontWeight: '600' },
  footer: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
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
  deleteText: { color: palette.expense },
  primaryButton: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  buttonDisabled: { opacity: 0.45 },
  surfacePressed: { opacity: 0.82 },
  primaryButtonPressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
});

