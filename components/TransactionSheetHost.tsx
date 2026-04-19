import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { palette, radius, spacing } from '@/constants/theme';
import { transactionRepository } from '@/data/repositories/transactionRepository';
import { refreshClosedMonthlySnapshots } from '@/data/summarySync';
import { nowIso, toDateOnlyIso } from '@/domain/dateRange';
import { formatCurrency, parseAmountInputToMinor } from '@/domain/money';
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

export function TransactionSheetHost() {
  const { categories } = useCategories();
  const composer = useAppStore((state) => state.composer);
  const closeComposer = useAppStore((state) => state.closeComposer);
  const bumpRefresh = useAppStore((state) => state.bumpRefresh);
  const setUndoCandidate = useAppStore((state) => state.setUndoCandidate);
  const [draft, setDraft] = useState<TransactionDraft>(createEmptyDraft());
  const [editingRecord, setEditingRecord] = useState<TransactionRecord | null>(null);

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === draft.type),
    [categories, draft.type]
  );

  useEffect(() => {
    async function loadComposer() {
      if (!composer.visible) {
        setEditingRecord(null);
        setDraft(createEmptyDraft());
        return;
      }

      if (composer.transactionId) {
        const transaction = await transactionRepository.getById(composer.transactionId);
        if (transaction) {
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

      setEditingRecord(null);
      setDraft((current) => ({
        ...createEmptyDraft(),
        type: current.type,
        categoryId: findDefaultCategory(current.type, categories),
      }));
    }

    loadComposer();
  }, [categories, composer.transactionId, composer.visible]);

  useEffect(() => {
    if (!composer.visible) {
      return;
    }
    if (!draft.categoryId && filteredCategories.length > 0) {
      setDraft((current) => ({ ...current, categoryId: filteredCategories[0].id }));
    }
  }, [composer.visible, draft.categoryId, filteredCategories]);

  const saveRecord = async (closeAfterSave: boolean) => {
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
      source: 'manual',
      sourceRefId: null,
      createdAt: editingRecord?.createdAt ?? timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };

    if (editingRecord) {
      await transactionRepository.update(payload);
    } else {
      await transactionRepository.create(payload);
    }

    await refreshClosedMonthlySnapshots();
    bumpRefresh();

    if (closeAfterSave || editingRecord) {
      closeComposer();
      return;
    }

    setDraft((current) => ({
      ...current,
      amountInput: '',
      note: '',
      occurredAt: toDateOnlyIso(new Date()),
    }));
  };

  const deleteRecord = async () => {
    if (!editingRecord) {
      return;
    }
    const deletedAt = nowIso();
    await transactionRepository.softDelete(editingRecord.id, deletedAt);
    await refreshClosedMonthlySnapshots();
    setUndoCandidate({ ...editingRecord, deletedAt });
    bumpRefresh();
    closeComposer();
  };

  return (
    <Modal visible={composer.visible} transparent animationType="slide" onRequestClose={closeComposer}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeComposer} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{editingRecord ? '\u7f16\u8f91\u8bb0\u5f55' : '\u65b0\u5efa\u8bb0\u5f55'}</Text>
            <Pressable onPress={closeComposer}><Text style={styles.link}>{'\u5173\u95ed'}</Text></Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
                    style={[styles.toggleChip, selected && styles.toggleChipSelected]}>
                    <Text style={[styles.toggleText, selected && styles.toggleTextSelected]}>{type === 'expense' ? '\u652f\u51fa' : '\u6536\u5165'}</Text>
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
            </View>

            <View style={styles.section}>
              <Text style={styles.fieldLabel}>{'\u5206\u7c7b'}</Text>
              <View style={styles.categoryWrap}>
                {filteredCategories.map((category) => {
                  const selected = draft.categoryId === category.id;
                  return (
                    <Pressable key={category.id} onPress={() => setDraft((current) => ({ ...current, categoryId: category.id }))} style={[styles.categoryChip, selected && { backgroundColor: category.color }]}> 
                      <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{category.icon} {category.name}</Text>
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
              <Text style={styles.fieldLabel}>{'\u65f6\u95f4'}</Text>
              <Pressable
                style={styles.datetimeButton}
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
                <Pressable onPress={deleteRecord} style={styles.secondaryButton}><Text style={[styles.secondaryButtonText, { color: palette.expense }]}>{'\u5220\u9664'}</Text></Pressable>
                <Pressable onPress={() => saveRecord(true)} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{'\u4fdd\u5b58\u4fee\u6539'}</Text></Pressable>
              </>
            ) : (
              <>
                <Pressable onPress={() => saveRecord(false)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{'\u4fdd\u5b58\u5e76\u7ee7\u7eed'}</Text></Pressable>
                <Pressable onPress={() => saveRecord(true)} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{'\u4fdd\u5b58'}</Text></Pressable>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: palette.overlay,
  },
  sheet: {
    height: '72%',
    backgroundColor: palette.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: palette.border,
    marginBottom: spacing.md,
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
  },
  toggleChipSelected: { backgroundColor: palette.primary },
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
  datetimeRow: { flexDirection: 'row', gap: spacing.sm },
  datetimeButton: {
    flex: 1,
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
  primaryButton: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
});
