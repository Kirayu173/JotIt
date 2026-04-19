import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';

import { elevation, palette, radius, spacing } from '@/constants/theme';

export function FloatingActionButton({ onPress, style }: { onPress: () => void; style?: ViewStyle }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, style]}
      accessibilityRole="button"
      accessibilityLabel={'新建记录'}>
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
    ...elevation.floating,
  },
  buttonPressed: { transform: [{ scale: 0.96 }] },
});

