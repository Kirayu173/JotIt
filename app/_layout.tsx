import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { useAppStore } from '@/store/useAppStore';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.background,
    card: palette.surface,
    text: palette.text,
    border: palette.border,
    primary: palette.primary,
  },
};

export default function RootLayout() {
  useAppBootstrap();
  const ready = useAppStore((state) => state.ready);
  const error = useAppStore((state) => state.error);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(palette.background);
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <FontAwesome name="warning" size={28} color={palette.expense} />
        <Text style={styles.title}>{'\u542f\u52a8\u5931\u8d25'}</Text>
        <Text style={styles.subtitle}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.title}>{'\u6b63\u5728\u51c6\u5907\u5e94\u7528'}</Text>
        <Text style={styles.subtitle}>{'\u521d\u59cb\u5316\u672c\u5730\u8d26\u672c\u4e0e\u6708\u5ea6\u603b\u7ed3...'}</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
    paddingHorizontal: 24,
    gap: 10,
  },
  title: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
