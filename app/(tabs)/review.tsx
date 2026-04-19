import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryBreakdownCard } from '@/components/CategoryBreakdownCard';
import { MetricCard } from '@/components/MetricCard';
import { PeriodPicker } from '@/components/PeriodPicker';
import { SectionTransactionList } from '@/components/SectionTransactionList';
import { SummaryCard } from '@/components/SummaryCard';
import { palette, radius, spacing } from '@/constants/theme';
import { canShiftForward, shiftAnchorDate } from '@/domain/dateRange';
import { formatCurrency } from '@/domain/money';
import { ReviewPeriod } from '@/domain/types';
import { useReviewData } from '@/features/review/useReviewData';
import { useAppStore } from '@/store/useAppStore';

export default function ReviewScreen() {
  const [period, setPeriod] = useState<ReviewPeriod>('month');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [customStart, setCustomStart] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [customEnd, setCustomEnd] = useState(new Date());
  const { width } = useWindowDimensions();
  const openEdit = useAppStore((state) => state.openEditComposer);
  const { range, loading, summary, categoriesById, sections } = useReviewData(period, anchorDate, customStart, customEnd);
  const canNext = useMemo(() => canShiftForward(period, anchorDate), [anchorDate, period]);
  const translateX = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);
  const swipeThreshold = Math.min(width * 0.18, 92);

  const contentOpacity = useMemo(
    () =>
      translateX.interpolate({
        inputRange: [-width, 0, width],
        outputRange: [0.82, 1, 0.82],
        extrapolate: 'clamp',
      }),
    [translateX, width]
  );

  const contentScale = useMemo(
    () =>
      translateX.interpolate({
        inputRange: [-width, 0, width],
        outputRange: [0.985, 1, 0.985],
        extrapolate: 'clamp',
      }),
    [translateX, width]
  );

  const depthOpacity = useMemo(
    () =>
      translateX.interpolate({
        inputRange: [-width, 0, width],
        outputRange: [0.22, 0, 0.22],
        extrapolate: 'clamp',
      }),
    [translateX, width]
  );

  const depthScale = useMemo(
    () =>
      translateX.interpolate({
        inputRange: [-width, 0, width],
        outputRange: [1, 0.968, 1],
        extrapolate: 'clamp',
      }),
    [translateX, width]
  );

  const animateBackToCenter = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      friction: 9,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [translateX]);

  const animatePeriodShift = useCallback(
    (direction: 'prev' | 'next') => {
      if (isAnimatingRef.current) {
        return;
      }

      isAnimatingRef.current = true;
      const exitTarget = direction === 'prev' ? width * 0.24 : -width * 0.24;
      const entryStart = direction === 'prev' ? -width * 0.14 : width * 0.14;

      Animated.timing(translateX, {
        toValue: exitTarget,
        duration: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          isAnimatingRef.current = false;
          return;
        }

        translateX.setValue(entryStart);
        setAnchorDate((current) => shiftAnchorDate(period, current, direction));

        requestAnimationFrame(() => {
          Animated.spring(translateX, {
            toValue: 0,
            friction: 10,
            tension: 85,
            useNativeDriver: true,
          }).start(() => {
            isAnimatingRef.current = false;
          });
        });
      });
    },
    [period, translateX, width]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          period !== 'custom' &&
          !isAnimatingRef.current &&
          Math.abs(gestureState.dx) > 18 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.15,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          period !== 'custom' &&
          !isAnimatingRef.current &&
          Math.abs(gestureState.dx) > 18 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.15,
        onPanResponderGrant: () => {
          translateX.stopAnimation();
        },
        onPanResponderMove: (_, gestureState) => {
          if (period === 'custom' || isAnimatingRef.current) {
            return;
          }

          const draggingTowardFuture = gestureState.dx < 0;
          const resistance = draggingTowardFuture && !canNext ? 0.22 : 1;
          translateX.setValue(gestureState.dx * resistance);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (period === 'custom' || isAnimatingRef.current) {
            animateBackToCenter();
            return;
          }

          const direction = gestureState.dx > 0 ? 'prev' : 'next';
          const passedDistance = Math.abs(gestureState.dx) > swipeThreshold;
          const passedVelocity = Math.abs(gestureState.vx) > 0.45;
          const shouldAdvance = passedDistance || passedVelocity;

          if (!shouldAdvance) {
            animateBackToCenter();
            return;
          }

          if (direction === 'next' && !canNext) {
            animateBackToCenter();
            return;
          }

          animatePeriodShift(direction);
        },
        onPanResponderTerminate: animateBackToCenter,
      }),
    [animateBackToCenter, animatePeriodShift, canNext, period, swipeThreshold, translateX]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.stage}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.depthLayer,
            {
              opacity: depthOpacity,
              transform: [{ scale: depthScale }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ translateX }, { scale: contentScale }],
            },
          ]}
          {...panResponder.panHandlers}>
          <SectionTransactionList
            sections={sections}
            categoriesById={categoriesById}
            loading={loading}
            emptyMessage={'\u5f53\u524d\u65f6\u95f4\u8303\u56f4\u6ca1\u6709\u8bb0\u5f55'}
            onPressTransaction={(transaction) => openEdit(transaction.id)}
            ListHeaderComponent={
              <View style={styles.header}>
                <Text style={styles.pageTitle}>{'\u56de\u987e'}</Text>
                <PeriodPicker
                  value={period}
                  onChange={(next) => setPeriod(next)}
                  label={range.label}
                  canGoNext={canNext}
                  onPrev={() => animatePeriodShift('prev')}
                  onNext={() => {
                    if (canNext) {
                      animatePeriodShift('next');
                    }
                  }}
                  onPickCustomStart={() => {
                    DateTimePickerAndroid.open({
                      value: customStart,
                      mode: 'date',
                      onChange: (_, value) => value && setCustomStart(value),
                    });
                  }}
                  onPickCustomEnd={() => {
                    DateTimePickerAndroid.open({
                      value: customEnd,
                      mode: 'date',
                      onChange: (_, value) => value && setCustomEnd(value),
                    });
                  }}
                  customStartLabel={customStart.toLocaleDateString('zh-CN')}
                  customEndLabel={customEnd.toLocaleDateString('zh-CN')}
                />
                <View style={styles.metricRow}>
                  <MetricCard title={'\u603b\u652f\u51fa'} value={formatCurrency(summary?.totalExpenseMinor ?? 0)} accent={palette.expense} />
                  <MetricCard title={'\u603b\u6536\u5165'} value={formatCurrency(summary?.totalIncomeMinor ?? 0)} accent={palette.income} />
                </View>
                <View style={styles.metricRow}>
                  <MetricCard
                    title={'\u51c0\u7ed3\u4f59'}
                    value={formatCurrency(summary?.netBalanceMinor ?? 0)}
                    accent={(summary?.netBalanceMinor ?? 0) >= 0 ? palette.income : palette.expense}
                  />
                  <MetricCard title={'\u6700\u9ad8\u652f\u51fa\u5206\u7c7b'} value={summary?.topCategoryName ?? '\u6682\u65e0'} />
                </View>
                <SummaryCard insights={summary?.insights ?? []} />
                <CategoryBreakdownCard items={summary?.topCategories ?? []} />
              </View>
            }
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  stage: { flex: 1, position: 'relative' },
  depthLayer: {
    position: 'absolute',
    top: 10,
    right: 10,
    bottom: 8,
    left: 10,
    borderRadius: radius.lg + 6,
    backgroundColor: '#E6ECE4',
    shadowColor: '#1F2E28',
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 9,
  },
  content: {
    flex: 1,
    backgroundColor: palette.background,
    borderRadius: radius.lg + 6,
    overflow: 'hidden',
  },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.md },
  pageTitle: { color: palette.text, fontSize: 28, fontWeight: '800' },
  metricRow: { flexDirection: 'row', gap: spacing.md },
});
