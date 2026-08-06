import { Redirect, Stack } from 'expo-router';

import { env } from '@/config/env';

/**
 * Development-only routes, gated by `EXPO_PUBLIC_ENABLE_DEV_ROUTES`.
 *
 * The guard is here rather than only in the root layout so the routes are
 * unreachable by deep link too, not just invisible in the navigator.
 */
export default function DevLayout() {
  if (!env.enableDevRoutes) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }} />;
}
