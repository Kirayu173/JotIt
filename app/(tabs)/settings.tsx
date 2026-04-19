import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, radius, spacing } from '@/constants/theme';
import { categoryRepository } from '@/data/repositories/categoryRepository';
import { createId, nowIso } from '@/domain/dateRange';
import { useCategories } from '@/hooks/useCategories';
import { useAppStore } from '@/store/useAppStore';

export default function SettingsScreen() {
  const { categories } = useCategories();
  const bumpRefresh = useAppStore((state) => state.bumpRefresh);
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');

  const grouped = useMemo(
    () => ({
      expense: categories.filter((category) => category.type === 'expense'),
      income: categories.filter((category) => category.type === 'income'),
    }),
    [categories]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>{'\u8bbe\u7f6e'}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{'\u65b0\u589e\u81ea\u5b9a\u4e49\u5206\u7c7b'}</Text>
          <TextInput value={name} onChangeText={setName} placeholder={'\u8f93\u5165\u5206\u7c7b\u540d\u79f0'} placeholderTextColor={palette.textMuted} style={styles.input} />
          <View style={styles.typeRow}>
            {(['expense', 'income'] as const).map((item) => {
              const selected = item === type;
              return (
                <Pressable key={item} onPress={() => setType(item)} style={[styles.typeChip, selected && styles.typeChipSelected]}>
                  <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>{item === 'expense' ? '\u652f\u51fa' : '\u6536\u5165'}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={async () => {
              const trimmed = name.trim();
              if (!trimmed) return;
              const timestamp = nowIso();
              await categoryRepository.create({
                id: createId('custom_category'),
                name: trimmed,
                type,
                color: type === 'expense' ? '#8A7CF3' : '#4CA36C',
                icon: type === 'expense' ? '\uD83D\uDCDD' : '\uD83D\uDCB0',
                sortOrder: categories.length + 1,
                isDefault: false,
                createdAt: timestamp,
                updatedAt: timestamp,
              });
              setName('');
              bumpRefresh();
            }}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{'\u4fdd\u5b58\u5206\u7c7b'}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{'\u5206\u7c7b\u7ba1\u7406'}</Text>
          <Text style={styles.sectionLabel}>{'\u652f\u51fa'}</Text>
          <View style={styles.tags}>
            {grouped.expense.map((item) => (
              <View key={item.id} style={styles.tag}>
                <Text style={styles.tagText}>{item.icon} {item.name}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.sectionLabel}>{'\u6536\u5165'}</Text>
          <View style={styles.tags}>
            {grouped.income.map((item) => (
              <View key={item.id} style={styles.tag}>
                <Text style={styles.tagText}>{item.icon} {item.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  container: { padding: spacing.md, gap: spacing.md, paddingBottom: 120 },
  pageTitle: { color: palette.text, fontSize: 28, fontWeight: '800' },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardTitle: { color: palette.text, fontSize: 16, fontWeight: '700' },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FCFCFA',
    color: palette.text,
  },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeChip: { flex: 1, borderRadius: radius.pill, backgroundColor: palette.surfaceMuted, paddingVertical: 10, alignItems: 'center' },
  typeChipSelected: { backgroundColor: palette.primary },
  typeChipText: { color: palette.textMuted, fontWeight: '700' },
  typeChipTextSelected: { color: '#FFFFFF' },
  primaryButton: { borderRadius: radius.md, backgroundColor: palette.primary, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  sectionLabel: { color: palette.textMuted, fontWeight: '700' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { paddingHorizontal: spacing.md, paddingVertical: 8, backgroundColor: palette.surfaceMuted, borderRadius: radius.pill },
  tagText: { color: palette.text, fontWeight: '600' },
});
