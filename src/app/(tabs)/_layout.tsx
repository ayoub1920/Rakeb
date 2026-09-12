import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, type ColorValue } from 'react-native';

import { SupportButton } from '@/features/support/SupportButton';
import { colors, sizes, typography } from '@/theme';

type TabIconName = keyof typeof Ionicons.glyphMap;

/** Outline glyph inactive, filled glyph active — the standard Ionicons tab convention. */
const TAB_ICONS: Record<string, { outline: TabIconName; filled: TabIconName }> = {
  index: { outline: 'home-outline', filled: 'home' },
  services: { outline: 'grid-outline', filled: 'grid' },
  activity: { outline: 'receipt-outline', filled: 'receipt' },
  messages: { outline: 'chatbubbles-outline', filled: 'chatbubbles' },
  account: { outline: 'person-outline', filled: 'person' },
};

function tabBarIcon(name: keyof typeof TAB_ICONS) {
  function TabBarIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return (
      <Ionicons name={focused ? TAB_ICONS[name].filled : TAB_ICONS[name].outline} size={sizes.icon.lg} color={color} />
    );
  }
  return TabBarIcon;
}

/** The five tabs. Labels are translated — they are product copy, unlike the placeholder screens below them. */
export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.brand.primary,
          tabBarInactiveTintColor: colors.text.tertiary,
          tabBarLabelStyle: { fontSize: typography.fontSize.xs },
          tabBarStyle: { borderTopColor: colors.border.default },
        }}
      >
        <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: tabBarIcon('index') }} />
        <Tabs.Screen
          name="services"
          options={{ title: t('tabs.services'), tabBarIcon: tabBarIcon('services') }}
        />
        <Tabs.Screen
          name="activity"
          options={{ title: t('tabs.activity'), tabBarIcon: tabBarIcon('activity') }}
        />
        <Tabs.Screen
          name="messages"
          options={{ title: t('tabs.messages'), tabBarIcon: tabBarIcon('messages') }}
        />
        <Tabs.Screen name="account" options={{ title: t('tabs.account'), tabBarIcon: tabBarIcon('account') }} />
      </Tabs>
      {/* Floating above the tab bar on every main screen. */}
      <SupportButton bottom={72} />
    </View>
  );
}
