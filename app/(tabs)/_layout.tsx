import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

import { TransactionSheetHost } from '@/components/TransactionSheetHost';
import { UndoToastHost } from '@/components/UndoToastHost';
import { palette } from '@/constants/theme';

function TabBarIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={20} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: palette.primary,
          tabBarInactiveTintColor: palette.textMuted,
          tabBarStyle: {
            backgroundColor: palette.surface,
            borderTopColor: palette.border,
          },
        }}>
        <Tabs.Screen name="index" options={{ title: '\u8bb0\u8d26', tabBarIcon: ({ color }) => <TabBarIcon name="list-alt" color={color} /> }} />
        <Tabs.Screen name="review" options={{ title: '\u56de\u987e', tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} /> }} />
        <Tabs.Screen name="settings" options={{ title: '\u8bbe\u7f6e', tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} /> }} />
      </Tabs>
      <TransactionSheetHost />
      <UndoToastHost />
    </>
  );
}
