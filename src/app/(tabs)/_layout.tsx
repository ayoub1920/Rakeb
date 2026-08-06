import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { colors, typography } from '@/theme';

/**
 * The five tabs.
 *
 * Labels are translated — they are product copy, unlike the placeholder screens
 * below them. Icons are intentionally absent: no icon set is a dependency yet,
 * and picking one is a design decision, not a scaffold decision.
 */
export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarLabelStyle: { fontSize: typography.fontSize.xs },
        tabBarStyle: { borderTopColor: colors.border.default },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="services" options={{ title: t('tabs.services') }} />
      <Tabs.Screen name="activity" options={{ title: t('tabs.activity') }} />
      <Tabs.Screen name="messages" options={{ title: t('tabs.messages') }} />
      <Tabs.Screen name="account" options={{ title: t('tabs.account') }} />
    </Tabs>
  );
}
