import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { transactionRepository } from '@/data/repositories/transactionRepository';
import { refreshClosedMonthlySnapshots } from '@/data/summarySync';
import { palette, radius, spacing } from '@/constants/theme';
import { nowIso } from '@/domain/dateRange';
import { useAppStore } from '@/store/useAppStore';

export function UndoToastHost() {
  const undoCandidate = useAppStore((state) => state.undoCandidate);
  const setUndoCandidate = useAppStore((state) => state.setUndoCandidate);
  const bumpRefresh = useAppStore((state) => state.bumpRefresh);

  useEffect(() => {
    if (!undoCandidate) return;
    const timer = setTimeout(() => setUndoCandidate(undefined), 4200);
    return () => clearTimeout(timer);
  }, [setUndoCandidate, undoCandidate]);

  if (!undoCandidate) return null;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.toast}>
        <Text style={styles.text}>{'\u8bb0\u5f55\u5df2\u5220\u9664'}</Text>
        <Pressable
          onPress={async () => {
            await transactionRepository.restore(undoCandidate.id, nowIso());
            await refreshClosedMonthlySnapshots();
            setUndoCandidate(undefined);
            bumpRefresh();
          }}>
          <Text style={styles.action}>{'\u64a4\u9500'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 82,
    alignItems: 'center',
  },
  toast: {
    minWidth: 220,
    maxWidth: '88%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#24352D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  text: { color: '#FFFFFF', fontSize: 14 },
  action: { color: '#A8F0C8', fontWeight: '700', fontSize: 14 },
});
