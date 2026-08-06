import { Stack } from 'expo-router';

import { colors } from '@/theme';

/**
 * Carpool stack — passenger and driver.
 *
 * Screens set their own `title` through `<Stack.Screen options>` so the title
 * stays next to the screen it names. The native header is kept (rather than a
 * custom one) so the platform back gesture and behaviour come for free.
 */
export default function CarpoolLayout() {
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
