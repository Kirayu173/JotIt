import { Pressable, StyleSheet, Text, View } from 'react-native';

import { elevation, palette, radius, spacing } from '@/constants/theme';
import { ReviewPeriod } from '@/domain/types';

const labels: Record<ReviewPeriod, string> = {
  week: '\u5468',
  month: '\u6708',
  quarter: '\u5b63',
  year: '\u5e74',
  custom: '\u81ea\u5b9a\u4e49',
};

export function PeriodPicker({
  value,
  onChange,
  label,
  canGoNext,
  onPrev,
  onNext,
  onPickCustomStart,
  onPickCustomEnd,
  customStartLabel,
  customEndLabel,
}: {
  value: ReviewPeriod;
  onChange: (period: ReviewPeriod) => void;
  label: string;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPickCustomStart: () => void;
  onPickCustomEnd: () => void;
  customStartLabel: string;
  customEndLabel: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        {Object.entries(labels).map(([key, text]) => {
          const selected = value === key;
          return (
            <Pressable key={key} onPress={() => onChange(key as ReviewPeriod)} style={[styles.chip, selected && styles.chipSelected]}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{text}</Text>
            </Pressable>
          );
        })}
      </View>
      {value === 'custom' ? (
        <View style={styles.customRow}>
          <Pressable style={styles.customButton} onPress={onPickCustomStart}>
            <Text style={styles.customText}>{customStartLabel}</Text>
          </Pressable>
          <Text style={styles.separator}>{'\u81f3'}</Text>
          <Pressable style={styles.customButton} onPress={onPickCustomEnd}>
            <Text style={styles.customText}>{customEndLabel}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.navRow}>
          <Pressable onPress={onPrev} style={styles.navButton}>
            <Text style={styles.navButtonText}>{'<'}</Text>
          </Pressable>
          <Text style={styles.label}>{label}</Text>
          <Pressable onPress={onNext} style={[styles.navButton, !canGoNext && styles.navButtonDisabled]} disabled={!canGoNext}>
            <Text style={styles.navButtonText}>{'>'}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipText: { color: palette.textMuted, fontWeight: '600' },
  chipTextSelected: { color: '#FFFFFF' },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...elevation.card,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: { opacity: 0.35 },
  navButtonText: { color: palette.text, fontSize: 20, lineHeight: 20, fontWeight: '700' },
  label: {
    flex: 1,
    minWidth: 0,
    color: palette.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: spacing.sm,
    ...elevation.card,
  },
  customButton: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
  },
  customText: { color: palette.text, fontWeight: '600' },
  separator: { color: palette.textMuted },
});

