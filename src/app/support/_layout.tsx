import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function SupportLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: colors.brand.primary,
        headerTitleStyle: { color: colors.text.primary },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background.default },
      }}
    />
  );
}
