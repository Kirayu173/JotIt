import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, PanResponder, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { palette, radius, spacing } from '@/constants/theme';

type BottomSheetControls = {
  requestClose: () => void;
};

export function BottomSheetModal({
  visible,
  onClose,
  children,
  sheetStyle,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode | ((controls: BottomSheetControls) => ReactNode);
  sheetStyle?: StyleProp<ViewStyle>;
}) {
  const fallbackOffset = Dimensions.get('window').height;
  const [sheetHeight, setSheetHeight] = useState(0);
  const closeDistance = sheetHeight > 0 ? sheetHeight + 24 : fallbackOffset;
  const translateY = useSharedValue(fallbackOffset);
  const closeDistanceValue = useSharedValue(closeDistance);
  const mountedRef = useRef(visible);
  const currentOffsetRef = useRef(fallbackOffset);
  const closeRequestedRef = useRef(false);
  const closeNotifiedRef = useRef(false);
  const [mounted, setMounted] = useState(visible);

  const finishUnmount = useCallback(() => {
    mountedRef.current = false;
    closeRequestedRef.current = false;
    closeNotifiedRef.current = false;
    setMounted(false);
    translateY.value = closeDistance;
    currentOffsetRef.current = closeDistance;
  }, [closeDistance, translateY]);

  const syncCurrentOffset = useCallback((value: number) => {
    currentOffsetRef.current = value;
  }, []);

  const handleCloseAnimationFinished = useCallback(
    (notifyParent: boolean) => {
      currentOffsetRef.current = closeDistance;
      if (notifyParent) {
        closeRequestedRef.current = true;
        if (!closeNotifiedRef.current) {
          closeNotifiedRef.current = true;
          onClose();
        }
        return;
      }

      finishUnmount();
    },
    [closeDistance, finishUnmount, onClose]
  );

  const animateOpen = useCallback(() => {
    cancelAnimation(translateY);
    translateY.value = closeDistance;
    currentOffsetRef.current = closeDistance;
    translateY.value = withSpring(
      0,
      {
        damping: 28,
        stiffness: 240,
        mass: 0.9,
        overshootClamping: false,
      },
      (finished) => {
        if (finished) {
          runOnJS(syncCurrentOffset)(0);
        }
      }
    );
  }, [closeDistance, syncCurrentOffset, translateY]);

  const animateClose = useCallback(
    (notifyParent: boolean) => {
      cancelAnimation(translateY);
      const startOffset = currentOffsetRef.current;
      const distanceRemaining = Math.max(0, closeDistance - startOffset);
      const distanceRatio = closeDistance === 0 ? 1 : Math.min(1, Math.max(0.35, distanceRemaining / closeDistance));
      const duration = Math.round(280 + 180 * distanceRatio);
      translateY.value = withTiming(
        closeDistance,
        {
          duration,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(handleCloseAnimationFinished)(notifyParent);
          }
        }
      );
    },
    [closeDistance, handleCloseAnimationFinished, translateY]
  );

  const requestClose = useCallback(() => {
    if (!mountedRef.current || closeRequestedRef.current) {
      return;
    }

    animateClose(true);
  }, [animateClose]);

  useEffect(() => {
    closeDistanceValue.value = closeDistance;
    if (!mountedRef.current) {
      translateY.value = closeDistance;
      currentOffsetRef.current = closeDistance;
    }
  }, [closeDistance, closeDistanceValue, translateY]);

  useEffect(() => {
    if (visible) {
      if (!mountedRef.current) {
        mountedRef.current = true;
        setMounted(true);
      }
      closeRequestedRef.current = false;
      closeNotifiedRef.current = false;
      return;
    }

    if (mountedRef.current) {
      if (closeRequestedRef.current) {
        finishUnmount();
        return;
      }

      animateClose(false);
    }
  }, [animateClose, finishUnmount, visible]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    animateOpen();
  }, [animateOpen, mounted]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderGrant: () => {
          cancelAnimation(translateY);
        },
        onPanResponderMove: (_, gestureState) => {
          const nextValue = Math.max(0, currentOffsetRef.current + gestureState.dy);
          currentOffsetRef.current = nextValue;
          translateY.value = nextValue;
        },
        onPanResponderRelease: (_, gestureState) => {
          const nextValue = Math.max(0, currentOffsetRef.current + gestureState.dy);
          currentOffsetRef.current = nextValue;

          const shouldClose = nextValue > 120 || gestureState.vy > 0.9;
          if (shouldClose) {
            requestClose();
            return;
          }

          translateY.value = withSpring(
            0,
            {
              damping: 28,
              stiffness: 240,
              mass: 0.9,
              overshootClamping: false,
            },
            (finished) => {
              if (finished) {
                runOnJS(syncCurrentOffset)(0);
              }
            }
          );
        },
        onPanResponderTerminate: () => {
          translateY.value = withSpring(
            0,
            {
              damping: 28,
              stiffness: 240,
              mass: 0.9,
              overshootClamping: false,
            },
            (finished) => {
              if (finished) {
                runOnJS(syncCurrentOffset)(0);
              }
            }
          );
        },
      }),
    [requestClose, syncCurrentOffset, translateY]
  );

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, closeDistanceValue.value], [1, 0], Extrapolation.CLAMP),
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted) {
    return null;
  }

  const renderedChildren = typeof children === 'function' ? children({ requestClose }) : children;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={requestClose}>
      <View style={styles.root} pointerEvents="box-none">
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, backdropAnimatedStyle]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} />
        <Animated.View
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            if (nextHeight > 0 && Math.abs(nextHeight - sheetHeight) > 1) {
              setSheetHeight(nextHeight);
            }
          }}
          style={[styles.sheet, sheetStyle, sheetAnimatedStyle]}>
          <View {...panResponder.panHandlers} style={styles.dragZone}>
            <View style={styles.handle} />
          </View>
          {renderedChildren}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: palette.overlay,
  },
  sheet: {
    backgroundColor: palette.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: palette.border,
  },
  dragZone: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: palette.border,
  },
});
