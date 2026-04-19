import { StyleSheet, Text, View } from 'react-native';

import { elevation, palette, radius, spacing } from '@/constants/theme';
import { formatCurrency } from '@/domain/money';
import { SummaryMetric } from '@/domain/types';

export function CategoryBreakdownCard({ items }: { items: SummaryMetric[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{'\u5206\u7c7b\u5360\u6bd4'}</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>{'\u5f53\u524d\u65f6\u95f4\u8303\u56f4\u6682\u65e0\u652f\u51fa'}</Text>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <View key={item.categoryId} style={styles.item}>
              <View style={styles.header}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.amount}>{formatCurrency(item.amountMinor)}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${Math.max(item.percentage * 100, 6)}%`, backgroundColor: item.color }]} />
              </View>
            </View>
          ))}
        </View>
      )}
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
    gap: spacing.sm,
    ...elevation.card,
  },
  title: { color: palette.text, fontSize: 17, fontWeight: '800' },
  empty: { color: palette.textMuted, fontSize: 14 },
  list: { gap: spacing.md },
  item: { gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  name: { color: palette.text, fontSize: 14, fontWeight: '600' },
  amount: { color: palette.textMuted, fontSize: 13 },
  track: {
    width: '100%',
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceMuted,
    overflow: 'hidden',
  },
  bar: { height: '100%', borderRadius: radius.pill },
});

