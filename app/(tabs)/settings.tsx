import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheetModal } from '@/components/BottomSheetModal';
import { palette, radius, spacing } from '@/constants/theme';
import {
  exportBackupJsonFile,
  exportTransactionsCsvFile,
  restoreBackupFromPicker,
  shareLocalFile,
} from '@/data/backupService';
import { syncDueRecurringOccurrences } from '@/data/recurringService';
import { categoryRepository } from '@/data/repositories/categoryRepository';
import { recurringRuleRepository } from '@/data/repositories/recurringRuleRepository';
import { createId, nowIso } from '@/domain/dateRange';
import { parseAmountInputToMinor } from '@/domain/money';
import { frequencyLabel } from '@/domain/recurring';
import { RecurringFrequency, RecurringRule } from '@/domain/types';
import { useCategories } from '@/hooks/useCategories';
import { useAppStore } from '@/store/useAppStore';

const recurringFrequencies: RecurringFrequency[] = ['weekly', 'monthly', 'yearly'];

export default function SettingsScreen() {
  const { categories } = useCategories();
  const ready = useAppStore((state) => state.ready);
  const refreshKey = useAppStore((state) => state.refreshKey);
  const bumpRefresh = useAppStore((state) => state.bumpRefresh);

  const [categorySheetVisible, setCategorySheetVisible] = useState(false);
  const [ruleSheetVisible, setRuleSheetVisible] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');

  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [editingRuleId, setEditingRuleId] = useState<string | undefined>();
  const [ruleType, setRuleType] = useState<'expense' | 'income'>('expense');
  const [ruleAmountInput, setRuleAmountInput] = useState('');
  const [ruleCategoryId, setRuleCategoryId] = useState('');
  const [ruleNote, setRuleNote] = useState('');
  const [ruleFrequency, setRuleFrequency] = useState<RecurringFrequency>('monthly');
  const [ruleAnchorDate, setRuleAnchorDate] = useState(new Date());
  const [workingAction, setWorkingAction] = useState<string | null>(null);
  const categoryResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ruleResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const grouped = useMemo(
    () => ({
      expense: categories.filter((category) => category.type === 'expense'),
      income: categories.filter((category) => category.type === 'income'),
    }),
    [categories]
  );

  const recurringCategories = useMemo(
    () => categories.filter((category) => category.type === ruleType),
    [categories, ruleType]
  );

  const canSaveCategory = name.trim().length > 0;
  const canSaveRule = Boolean(ruleCategoryId) && parseAmountInputToMinor(ruleAmountInput) > 0;

  useEffect(() => {
    let active = true;

    async function loadRules() {
      if (!ready) return;
      setLoadingRules(true);
      const items = await recurringRuleRepository.listAll();
      if (active) {
        setRules(items);
        setLoadingRules(false);
      }
    }

    loadRules();

    return () => {
      active = false;
    };
  }, [ready, refreshKey]);

  useEffect(() => {
    return () => {
      if (categoryResetTimerRef.current) {
        clearTimeout(categoryResetTimerRef.current);
      }
      if (ruleResetTimerRef.current) {
        clearTimeout(ruleResetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!ruleCategoryId && recurringCategories.length > 0) {
      setRuleCategoryId(recurringCategories[0].id);
    }
  }, [recurringCategories, ruleCategoryId]);

  function resetCategoryForm() {
    setName('');
    setType('expense');
  }

  function resetRuleForm() {
    setEditingRuleId(undefined);
    setRuleType('expense');
    setRuleAmountInput('');
    setRuleCategoryId(grouped.expense[0]?.id ?? '');
    setRuleNote('');
    setRuleFrequency('monthly');
    setRuleAnchorDate(new Date());
  }

  function openCategorySheet() {
    if (categoryResetTimerRef.current) {
      clearTimeout(categoryResetTimerRef.current);
      categoryResetTimerRef.current = null;
    }
    resetCategoryForm();
    setCategorySheetVisible(true);
  }

  function closeCategorySheet() {
    setCategorySheetVisible(false);
    if (categoryResetTimerRef.current) {
      clearTimeout(categoryResetTimerRef.current);
    }
    categoryResetTimerRef.current = setTimeout(() => {
      resetCategoryForm();
      categoryResetTimerRef.current = null;
    }, 260);
  }

  function openCreateRuleSheet() {
    if (ruleResetTimerRef.current) {
      clearTimeout(ruleResetTimerRef.current);
      ruleResetTimerRef.current = null;
    }
    resetRuleForm();
    setRuleSheetVisible(true);
  }

  function openEditRuleSheet(rule: RecurringRule) {
    setEditingRuleId(rule.id);
    setRuleType(rule.type);
    setRuleAmountInput((rule.amountMinor / 100).toFixed(2));
    setRuleCategoryId(rule.categoryId);
    setRuleNote(rule.note ?? '');
    setRuleFrequency(rule.frequency);
    setRuleAnchorDate(new Date(`${rule.anchorDate}T12:00:00`));
    setRuleSheetVisible(true);
  }

  function closeRuleSheet() {
    setRuleSheetVisible(false);
    if (ruleResetTimerRef.current) {
      clearTimeout(ruleResetTimerRef.current);
    }
    ruleResetTimerRef.current = setTimeout(() => {
      resetRuleForm();
      ruleResetTimerRef.current = null;
    }, 260);
  }

  async function saveCategory() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const timestamp = nowIso();
    await categoryRepository.create({
      id: createId('custom_category'),
      name: trimmed,
      type,
      color: type === 'expense' ? '#D57A5C' : '#4C956C',
      icon: type === 'expense' ? '\uD83D\uDCDD' : '\uD83D\uDCB0',
      sortOrder: categories.length + 1,
      isDefault: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    bumpRefresh();
    closeCategorySheet();
  }

  async function saveRule() {
    const amountMinor = parseAmountInputToMinor(ruleAmountInput);
    if (!ruleCategoryId || amountMinor <= 0) {
      return;
    }

    const existingRule = editingRuleId ? rules.find((item) => item.id === editingRuleId) : undefined;
    const timestamp = nowIso();
    const nextOccurrenceDate = existingRule?.nextOccurrenceDate ?? ruleAnchorDate.toISOString().slice(0, 10);

    const payload: RecurringRule = {
      id: existingRule?.id ?? createId('rule'),
      type: ruleType,
      amountMinor,
      currency: 'CNY',
      categoryId: ruleCategoryId,
      note: ruleNote.trim() || null,
      frequency: ruleFrequency,
      intervalCount: 1,
      anchorDate: ruleAnchorDate.toISOString().slice(0, 10),
      nextOccurrenceDate,
      status: existingRule?.status ?? 'active',
      createdAt: existingRule?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    setWorkingAction('rule');
    try {
      if (existingRule) {
        await recurringRuleRepository.update(payload);
      } else {
        await recurringRuleRepository.create(payload);
      }
      await syncDueRecurringOccurrences();
      bumpRefresh();
      closeRuleSheet();
    } finally {
      setWorkingAction(null);
    }
  }

  async function shareExport(kind: 'csv' | 'json') {
    setWorkingAction(kind);
    try {
      const uri = kind === 'csv' ? await exportTransactionsCsvFile() : await exportBackupJsonFile();
      const shared = await shareLocalFile(uri, kind === 'csv' ? 'text/csv' : 'application/json');
      Alert.alert(
        kind === 'csv' ? '\u5df2\u751f\u6210 CSV \u5bfc\u51fa' : '\u5df2\u751f\u6210 JSON \u5907\u4efd',
        shared
          ? '\u5df2\u62c9\u8d77\u7cfb\u7edf\u5206\u4eab\uff0c\u53ef\u4ee5\u4fdd\u5b58\u5230\u672c\u5730\u6216\u53d1\u7ed9\u81ea\u5df1\u3002'
          : uri
      );
    } catch (error) {
      Alert.alert('\u64cd\u4f5c\u5931\u8d25', error instanceof Error ? error.message : '\u8bf7\u7a0d\u540e\u518d\u8bd5');
    } finally {
      setWorkingAction(null);
    }
  }

  async function restoreBackup() {
    setWorkingAction('restore');
    try {
      const payload = await restoreBackupFromPicker();
      if (!payload) {
        return;
      }
      bumpRefresh();
      Alert.alert(
        '\u6062\u590d\u5b8c\u6210',
        `\u5df2\u5bfc\u5165 ${payload.transactions.length} \u7b14\u8bb0\u5f55\u548c ${payload.recurringRules.length} \u6761\u5468\u671f\u89c4\u5219\u3002`
      );
    } catch (error) {
      Alert.alert('\u6062\u590d\u5931\u8d25', error instanceof Error ? error.message : '\u5907\u4efd\u6587\u4ef6\u65e0\u6548');
    } finally {
      setWorkingAction(null);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{'\u8bbe\u7f6e'}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.sectionHeader}>
              <Text style={styles.cardTitle}>{'\u5468\u671f\u89c4\u5219'}</Text>
            </View>
            <Pressable onPress={openCreateRuleSheet} style={({ pressed }) => [styles.entryButton, pressed && styles.surfacePressed]}>
              <Text style={styles.entryButtonText}>{'\u65b0\u589e\u89c4\u5219'}</Text>
            </Pressable>
          </View>
          {loadingRules ? (
            <Text style={styles.emptyText}>{'\u6b63\u5728\u52a0\u8f7d...'}</Text>
          ) : rules.length === 0 ? (
            <Text style={styles.emptyText}>{'\u6682\u65f6\u8fd8\u6ca1\u6709\u5468\u671f\u89c4\u5219'}</Text>
          ) : (
            <View style={styles.ruleList}>
              {rules.map((rule) => {
                const category = categories.find((item) => item.id === rule.categoryId);
                const isToggling = workingAction === `toggle_${rule.id}`;
                const isDeleting = workingAction === `delete_${rule.id}`;
                const isPaused = rule.status === 'paused';

                return (
                  <View key={rule.id} style={styles.ruleCard}>
                    <View style={styles.ruleHeader}>
                      <View style={styles.ruleMain}>
                        <Text style={styles.ruleTitle}>
                          {category?.icon ?? '\uD83D\uDD01'} {category?.name ?? '\u672a\u5206\u7c7b'} {`\u00b7 ${(rule.amountMinor / 100).toFixed(2)}`}
                        </Text>
                        <Text style={styles.ruleMeta}>
                          {frequencyLabel(rule.frequency)} {`\u00b7 \u4e0b\u4e00\u6b21 ${rule.nextOccurrenceDate}`}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, isPaused && styles.statusBadgePaused]}>
                        <Text style={[styles.statusBadgeText, isPaused && styles.statusBadgeTextPaused]}>
                          {isPaused ? '\u5df2\u6682\u505c' : '\u8fd0\u884c\u4e2d'}
                        </Text>
                      </View>
                    </View>
                    {rule.note ? <Text style={styles.ruleNote}>{rule.note}</Text> : null}
                    <View style={styles.ruleActions}>
                      <Pressable onPress={() => openEditRuleSheet(rule)} style={({ pressed }) => [styles.inlineAction, styles.inlineActionNeutral, pressed && styles.surfacePressed]}>
                        <Text style={[styles.inlineActionText, styles.inlineActionNeutralText]}>{'\u7f16\u8f91'}</Text>
                      </Pressable>
                      <Pressable
                        onPress={async () => {
                          setWorkingAction(`toggle_${rule.id}`);
                          try {
                            await recurringRuleRepository.update({
                              ...rule,
                              status: rule.status === 'active' ? 'paused' : 'active',
                              updatedAt: nowIso(),
                            });
                            await syncDueRecurringOccurrences();
                            bumpRefresh();
                          } finally {
                            setWorkingAction(null);
                          }
                        }}
                        disabled={isToggling}
                        style={({ pressed }) => [
                          styles.inlineAction,
                          isPaused ? styles.inlineActionSuccess : styles.inlineActionWarning,
                          isToggling && styles.buttonDisabled,
                          pressed && !isToggling && styles.surfacePressed,
                        ]}>
                        <Text style={[styles.inlineActionText, isPaused ? styles.inlineActionSuccessText : styles.inlineActionWarningText]}>
                          {isToggling ? '\u5904\u7406\u4e2d...' : isPaused ? '\u542f\u7528' : '\u6682\u505c'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={async () => {
                          setWorkingAction(`delete_${rule.id}`);
                          try {
                            await recurringRuleRepository.delete(rule.id);
                            if (editingRuleId === rule.id) {
                              closeRuleSheet();
                            }
                            bumpRefresh();
                          } finally {
                            setWorkingAction(null);
                          }
                        }}
                        disabled={isDeleting}
                        style={({ pressed }) => [styles.inlineAction, styles.inlineActionDanger, isDeleting && styles.buttonDisabled, pressed && !isDeleting && styles.surfacePressed]}>
                        <Text style={[styles.inlineActionText, styles.inlineActionDangerText]}>
                          {isDeleting ? '\u5220\u9664\u4e2d...' : '\u5220\u9664'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.sectionHeader}>
              <Text style={styles.cardTitle}>{'\u5206\u7c7b\u5217\u8868'}</Text>
            </View>
            <Pressable onPress={openCategorySheet} style={({ pressed }) => [styles.entryButton, pressed && styles.surfacePressed]}>
              <Text style={styles.entryButtonText}>{'\u65b0\u589e\u5206\u7c7b'}</Text>
            </Pressable>
          </View>
          <Text style={styles.groupTitle}>{'\u652f\u51fa'}</Text>
          <View style={styles.tags}>
            {grouped.expense.map((item) => (
              <View key={item.id} style={styles.tag}>
                <Text style={styles.tagText}>
                  {item.icon} {item.name}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.groupTitle}>{'\u6536\u5165'}</Text>
          <View style={styles.tags}>
            {grouped.income.map((item) => (
              <View key={item.id} style={styles.tag}>
                <Text style={styles.tagText}>
                  {item.icon} {item.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>{'\u5bfc\u51fa\u4e0e\u6062\u590d'}</Text>
          </View>
          <Pressable
            onPress={() => shareExport('csv')}
            disabled={workingAction !== null}
            style={({ pressed }) => [styles.secondaryButton, workingAction !== null && styles.buttonDisabled, pressed && workingAction === null && styles.surfacePressed]}>
            <Text style={styles.secondaryButtonText}>{workingAction === 'csv' ? '\u5bfc\u51fa\u4e2d...' : '\u5bfc\u51fa CSV'}</Text>
          </Pressable>
          <Pressable
            onPress={() => shareExport('json')}
            disabled={workingAction !== null}
            style={({ pressed }) => [styles.secondaryButton, workingAction !== null && styles.buttonDisabled, pressed && workingAction === null && styles.surfacePressed]}>
            <Text style={styles.secondaryButtonText}>{workingAction === 'json' ? '\u5bfc\u51fa\u4e2d...' : '\u5bfc\u51fa JSON \u5907\u4efd'}</Text>
          </Pressable>
          <Pressable
            onPress={restoreBackup}
            disabled={workingAction !== null}
            style={({ pressed }) => [styles.warningButton, workingAction !== null && styles.buttonDisabled, pressed && workingAction === null && styles.surfacePressed]}>
            <Text style={styles.warningButtonText}>{workingAction === 'restore' ? '\u6062\u590d\u4e2d...' : '\u4ece JSON \u6062\u590d'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BottomSheetModal visible={categorySheetVisible} onClose={closeCategorySheet} sheetStyle={styles.categorySheet}>
        {({ requestClose }) => (
          <>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{'\u65b0\u589e\u81ea\u5b9a\u4e49\u5206\u7c7b'}</Text>
              <Pressable onPress={requestClose}>
                <Text style={styles.sheetCloseText}>{'\u5173\u95ed'}</Text>
              </Pressable>
            </View>
            <View style={styles.sheetContent}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={'\u8f93\u5165\u5206\u7c7b\u540d\u79f0'}
                placeholderTextColor={palette.textMuted}
                style={styles.input}
              />
              <View style={styles.typeRow}>
                {(['expense', 'income'] as const).map((item) => {
                  const selected = item === type;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => setType(item)}
                      style={({ pressed }) => [styles.typeChip, selected && styles.typeChipSelected, pressed && styles.surfacePressed]}>
                      <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                        {item === 'expense' ? '\u652f\u51fa' : '\u6536\u5165'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={styles.sheetFooter}>
              <Pressable onPress={requestClose} style={({ pressed }) => [styles.secondaryButton, pressed && styles.surfacePressed]}>
                <Text style={styles.secondaryButtonText}>{'\u53d6\u6d88'}</Text>
              </Pressable>
              <Pressable
                onPress={saveCategory}
                disabled={!canSaveCategory}
                style={({ pressed }) => [styles.primaryButton, !canSaveCategory && styles.buttonDisabled, pressed && canSaveCategory && styles.primaryButtonPressed]}>
                <Text style={styles.primaryButtonText}>{'\u4fdd\u5b58\u5206\u7c7b'}</Text>
              </Pressable>
            </View>
          </>
        )}
      </BottomSheetModal>

      <BottomSheetModal visible={ruleSheetVisible} onClose={closeRuleSheet} sheetStyle={styles.sheet}>
        {({ requestClose }) => (
          <>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{editingRuleId ? '\u7f16\u8f91\u5468\u671f\u89c4\u5219' : '\u65b0\u5efa\u5468\u671f\u89c4\u5219'}</Text>
              <Pressable onPress={requestClose}>
                <Text style={styles.sheetCloseText}>{'\u5173\u95ed'}</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.sheetScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.typeRow}>
                {(['expense', 'income'] as const).map((item) => {
                  const selected = item === ruleType;
                  return (
                    <Pressable
                      key={`rule_${item}`}
                      onPress={() => {
                        setRuleType(item);
                        setRuleCategoryId(categories.find((category) => category.type === item)?.id ?? '');
                      }}
                      style={({ pressed }) => [styles.typeChip, selected && styles.typeChipSelected, pressed && styles.surfacePressed]}>
                      <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                        {item === 'expense' ? '\u652f\u51fa' : '\u6536\u5165'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                value={ruleAmountInput}
                onChangeText={(value) => setRuleAmountInput(value.replace(/[^\d.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder={'\u91d1\u989d\uff0c\u5982 29.90'}
                placeholderTextColor={palette.textMuted}
                style={styles.input}
              />
              <TextInput
                value={ruleNote}
                onChangeText={setRuleNote}
                placeholder={'\u5907\u6ce8\uff0c\u5982 \u89c6\u9891\u4f1a\u5458'}
                placeholderTextColor={palette.textMuted}
                style={styles.input}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inlineRow}>
                {recurringFrequencies.map((item) => {
                  const selected = item === ruleFrequency;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => setRuleFrequency(item)}
                      style={({ pressed }) => [styles.inlineChip, selected && styles.inlineChipSelected, pressed && styles.surfacePressed]}>
                      <Text style={[styles.inlineChipText, selected && styles.inlineChipTextSelected]}>
                        {frequencyLabel(item)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Pressable
                style={({ pressed }) => [styles.inputButton, pressed && styles.surfacePressed]}
                onPress={() => {
                  DateTimePickerAndroid.open({
                    value: ruleAnchorDate,
                    mode: 'date',
                    onChange: (_, value) => value && setRuleAnchorDate(value),
                  });
                }}>
                <Text style={styles.inputButtonText}>{`\u9996\u6b21\u65e5\u671f\uff1a${ruleAnchorDate.toLocaleDateString('zh-CN')}`}</Text>
              </Pressable>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inlineRow}>
                {recurringCategories.map((category) => {
                  const selected = category.id === ruleCategoryId;
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => setRuleCategoryId(category.id)}
                      style={({ pressed }) => [
                        styles.inlineChip,
                        selected && { backgroundColor: category.color, borderColor: category.color },
                        pressed && styles.surfacePressed,
                      ]}>
                      <Text style={[styles.inlineChipText, selected && styles.inlineChipTextSelected]}>
                        {category.icon} {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </ScrollView>
            <View style={styles.sheetFooter}>
              <Pressable onPress={requestClose} style={({ pressed }) => [styles.secondaryButton, pressed && styles.surfacePressed]}>
                <Text style={styles.secondaryButtonText}>{'\u53d6\u6d88'}</Text>
              </Pressable>
              <Pressable
                onPress={saveRule}
                disabled={!canSaveRule || workingAction === 'rule'}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (!canSaveRule || workingAction === 'rule') && styles.buttonDisabled,
                  pressed && canSaveRule && workingAction !== 'rule' && styles.primaryButtonPressed,
                ]}>
                <Text style={styles.primaryButtonText}>
                  {workingAction === 'rule'
                    ? '\u4fdd\u5b58\u4e2d...'
                    : editingRuleId
                      ? '\u4fdd\u5b58\u89c4\u5219'
                      : '\u65b0\u5efa\u89c4\u5219'}
                </Text>
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
  container: { padding: spacing.md, gap: spacing.md, paddingBottom: 120 },
  pageHeader: { gap: 4 },
  pageTitle: { color: palette.text, fontSize: 28, fontWeight: '800' },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  sectionHeader: { gap: 4, flex: 1 },
  cardTitle: { color: palette.text, fontSize: 17, fontWeight: '800' },
  entryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
  },
  entryButtonText: { color: palette.text, fontWeight: '700', fontSize: 13 },
  emptyText: { color: palette.textMuted, fontSize: 14 },
  groupTitle: { color: palette.textMuted, fontWeight: '700', fontSize: 13 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tagText: { color: palette.text, fontWeight: '600' },
  ruleList: { gap: spacing.md },
  ruleCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: palette.surfaceSoft,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  ruleMain: { flex: 1, gap: 4 },
  ruleTitle: { color: palette.text, fontWeight: '700', lineHeight: 20 },
  ruleMeta: { color: palette.textMuted, fontSize: 12 },
  ruleNote: { color: palette.text, fontSize: 13, lineHeight: 19 },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: palette.incomeMuted,
  },
  statusBadgePaused: { backgroundColor: '#FFF1DD' },
  statusBadgeText: { color: palette.income, fontWeight: '700', fontSize: 12 },
  statusBadgeTextPaused: { color: palette.warning },
  ruleActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  inlineAction: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill },
  inlineActionText: { fontWeight: '700', fontSize: 12 },
  inlineActionNeutral: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  inlineActionNeutralText: { color: palette.text },
  inlineActionSuccess: { backgroundColor: palette.incomeMuted },
  inlineActionSuccessText: { color: palette.income },
  inlineActionWarning: { backgroundColor: '#FFF1DD' },
  inlineActionWarningText: { color: palette.warning },
  inlineActionDanger: { backgroundColor: palette.expenseMuted },
  inlineActionDangerText: { color: palette.expense },
  secondaryButton: {
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  secondaryButtonText: { color: palette.text, fontWeight: '700' },
  warningButton: {
    borderRadius: radius.md,
    backgroundColor: palette.expenseMuted,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningButtonText: { color: palette.expense, fontWeight: '700' },
  sheet: {
    height: '72%',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  categorySheet: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: { color: palette.text, fontSize: 20, fontWeight: '800' },
  sheetCloseText: { color: palette.primary, fontWeight: '700', fontSize: 14 },
  sheetContent: { gap: spacing.md },
  sheetScrollContent: { gap: spacing.md, paddingBottom: spacing.md },
  sheetFooter: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.surface,
    color: palette.text,
  },
  inputButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.surface,
  },
  inputButtonText: { color: palette.text, fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeChip: {
    flex: 1,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceMuted,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeChipSelected: { backgroundColor: palette.primary, borderColor: palette.primary },
  typeChipText: { color: palette.textMuted, fontWeight: '700' },
  typeChipTextSelected: { color: '#FFFFFF' },
  inlineRow: { gap: spacing.sm, paddingRight: spacing.md },
  inlineChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inlineChipSelected: { backgroundColor: palette.primary, borderColor: palette.primary },
  inlineChipText: { color: palette.textMuted, fontWeight: '600' },
  inlineChipTextSelected: { color: '#FFFFFF' },
  primaryButton: {
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  buttonDisabled: { opacity: 0.45 },
  surfacePressed: { opacity: 0.82 },
  primaryButtonPressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
});

