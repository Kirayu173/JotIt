import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{'\u9875\u9762\u4e0d\u5b58\u5728'}</Text>
      <Link href="/(tabs)" style={styles.link}>{'\u8fd4\u56de\u9996\u9875'}</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700',
  },
  link: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
