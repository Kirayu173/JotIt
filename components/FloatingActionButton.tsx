import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';

import { palette, radius, spacing } from '@/constants/theme';

export function FloatingActionButton({ onPress, style }: { onPress: () => void; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} style={[styles.button, style]} accessibilityRole="button" accessibilityLabel={'\u65b0\u5efa\u8bb0\u5f55'}>
      <FontAwesome name="plus" size={22} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.shadow,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
