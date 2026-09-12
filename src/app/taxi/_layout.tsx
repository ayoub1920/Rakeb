import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/theme';

/**
 * Taxi stack — passenger and driver. Lives outside `(tabs)`, so the bottom
 * tab bar never shows on any taxi screen (same mechanism `carpool/_layout.tsx`
 * uses).
 *
 * `passenger` and `driver` are nested stacks with their own per-screen
 * headers — without `headerShown: false` here, the parent stack would stack
 * a second, empty bar on top of every nested screen.
 */
export default function TaxiLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="passenger" options={{ headerShown: false }} />
      <Stack.Screen name="driver" options={{ headerShown: false }} />
    </Stack>
  );
}
