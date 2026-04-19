import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing } from '@/constants/theme';

export function MetricCard({ title, value, accent, helper }: { title: string; value: string; accent?: string; helper?: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, accent ? { color: accent } : null]}>{value}</Text>
      {helper ? <View style={styles.helper}>{helper}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 90,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    color: palette.textMuted,
    fontSize: 13,
  },
  value: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '700',
  },
  helper: {
    marginTop: 'auto',
  },
});
