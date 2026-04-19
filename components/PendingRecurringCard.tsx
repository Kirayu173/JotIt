import { Pressable, StyleSheet, Text, View } from 'react-native';

import { elevation, palette, radius, spacing } from '@/constants/theme';
import { PendingRecurringItem } from '@/data/recurringService';
import { formatDateLabel } from '@/domain/dateRange';
import { formatCurrency } from '@/domain/money';
import { frequencyLabel } from '@/domain/recurring';

export function PendingRecurringCard({
  items,
  onConfirm,
  onSkip,
}: {
  items: PendingRecurringItem[];
  onConfirm: (item: PendingRecurringItem) => void;
  onSkip: (item: PendingRecurringItem) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{'\u5468\u671f\u8bb0\u5f55\u5f85\u786e\u8ba4'}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{`${items.length} \u7b14`}</Text>
        </View>
      </View>
      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.occurrence.id} style={styles.row}>
            <View style={[styles.rowAccent, { backgroundColor: item.category?.color ?? palette.primary }]} />
            <View style={styles.rowBody}>
              <View style={styles.rowTop}>
                <View style={styles.content}>
                  <Text style={styles.rowTitle}>
                    {item.category?.icon ?? '\uD83D\uDD01'} {item.category?.name ?? '\u5468\u671f\u9879'}
                  </Text>
                  <Text style={styles.rowSubtitle}>
                    {formatDateLabel(item.occurrence.plannedDate)}
                    {` \u00b7 ${frequencyLabel(item.rule.frequency)}`}
                    {item.rule.note ? ` \u00b7 ${item.rule.note}` : ''}
                  </Text>
                </View>
                <Text style={styles.amount}>{formatCurrency(item.rule.amountMinor)}</Text>
              </View>
              <View style={styles.actions}>
                <Pressable onPress={() => onSkip(item)} style={({ pressed }) => [styles.skipButton, pressed && styles.actionPressed]}>
                  <Text style={styles.skipText}>{'\u8df3\u8fc7'}</Text>
                </Pressable>
                <Pressable
                  onPress={() => onConfirm(item)}
                  style={({ pressed }) => [styles.confirmButton, pressed && styles.confirmButtonPressed]}>
                  <Text style={styles.confirmText}>{'\u786e\u8ba4\u5165\u8d26'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.md,
    ...elevation.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    gap: 4,
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '800',
  },
  countBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.primaryMuted,
  },
  countText: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceSoft,
    overflow: 'hidden',
  },
  rowAccent: { width: 5 },
  rowBody: {
    flex: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowTop: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
  },
  rowSubtitle: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  amount: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  skipButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  skipText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700',
  },
  confirmButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.primary,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionPressed: { opacity: 0.8 },
  confirmButtonPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
});

