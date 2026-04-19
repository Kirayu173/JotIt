import { StyleSheet, Text, View } from 'react-native';

import { elevation, palette, radius, spacing } from '@/constants/theme';
import { SummaryInsight } from '@/domain/types';

export function SummaryCard({ insights }: { insights: SummaryInsight[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{'\u81ea\u52a8\u603b\u7ed3'}</Text>
      {insights.length === 0 ? (
        <Text style={styles.empty}>{'\u672c\u671f\u6682\u65e0\u53ef\u603b\u7ed3\u7684\u91cd\u70b9'}</Text>
      ) : (
        <View style={styles.list}>
          {insights.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.dot} />
              <Text style={styles.text}>{item.text}</Text>
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
  title: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '800',
  },
  empty: { color: palette.textMuted, lineHeight: 20 },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  dot: {
    width: 8,
    height: 8,
    marginTop: 6,
    borderRadius: 999,
    backgroundColor: palette.primary,
  },
  text: { flex: 1, color: palette.text, lineHeight: 21 },
});

