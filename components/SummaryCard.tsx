import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing } from '@/constants/theme';
import { SummaryInsight } from '@/domain/types';

export function SummaryCard({ insights }: { insights: SummaryInsight[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{'\u81ea\u52a8\u603b\u7ed3'}</Text>
      <View style={styles.list}>
        {insights.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.dot} />
            <Text style={styles.text}>{item.text}</Text>
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
    gap: spacing.sm,
  },
  title: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  dot: {
    width: 7,
    height: 7,
    marginTop: 6,
    borderRadius: 999,
    backgroundColor: palette.primary,
  },
  text: { flex: 1, color: palette.text, lineHeight: 20 },
});
