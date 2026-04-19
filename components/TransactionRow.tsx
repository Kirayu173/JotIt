import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing } from '@/constants/theme';
import { formatDateLabel } from '@/domain/dateRange';
import { formatCurrency } from '@/domain/money';
import { Category, TransactionRecord } from '@/domain/types';

export function TransactionRow({ transaction, category, onPress }: { transaction: TransactionRecord; category?: Category; onPress: () => void }) {
  const amountColor = transaction.type === 'expense' ? palette.expense : palette.income;
  const amountPrefix = transaction.type === 'expense' ? '-' : '+';
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{category?.icon ?? '\uD83D\uDCD2'}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{category?.name ?? '\u672a\u5206\u7c7b'}</Text>
        <Text style={styles.subtitle}>{transaction.note?.trim() || '\u624B\u52A8\u8BB0\u8D26'}</Text>
      </View>
      <View style={styles.amountWrap}>
        <Text style={[styles.amount, { color: amountColor }]}>{amountPrefix}{formatCurrency(transaction.amountMinor)}</Text>
        <Text style={styles.time}>{formatDateLabel(transaction.occurredAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.surface,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  content: { flex: 1, gap: 4 },
  title: { color: palette.text, fontSize: 15, fontWeight: '600' },
  subtitle: { color: palette.textMuted, fontSize: 12 },
  amountWrap: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 15, fontWeight: '700' },
  time: { color: palette.textMuted, fontSize: 12 },
});
