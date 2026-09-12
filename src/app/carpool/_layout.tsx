import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/theme';

/**
 * Carpool stack — passenger and driver.
 *
 * Screens set their own `title` through `<Stack.Screen options>` so the title
 * stays next to the screen it names. The native header is kept (rather than a
 * custom one) so the platform back gesture and behaviour come for free.
 */
export default function CarpoolLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      {/* The publish wizard is a nested stack with its own per-step headers —
          without this the parent stack stacks a second, empty "publish" bar
          on top of every step. */}
      <Stack.Screen name="publish" options={{ headerShown: false }} />
    </Stack>
  );
}
