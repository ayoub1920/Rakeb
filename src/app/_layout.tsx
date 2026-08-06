import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useAuthStatus } from '@/auth/use-auth';
import { useProtectedRoute } from '@/auth/use-protected-route';
import { LoadingView } from '@/components';
import { env } from '@/config/env';
import { AppProviders } from '@/providers/AppProviders';
import { colors } from '@/theme';

/**
 * Root layout — the only place providers are mounted.
 *
 * Route files below this one do routing, route params, navigation options and
 * screen composition. Nothing else.
 */
export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppProviders>
  );
}

function RootNavigator() {
  const status = useAuthStatus();
  useProtectedRoute();

  // Hold the navigator back until the session is restored. Mounting it first
  // would render a protected screen for one frame before the guard redirects.
  if (status === 'loading') {
    return <LoadingView label="Chargement…" />;
  }

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.brand.primary,
        headerTitleStyle: { color: colors.text.primary },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background.default },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="carpool" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="support" options={{ headerShown: false }} />
      <Stack.Screen name="(modals)" options={{ headerShown: false, presentation: 'modal' }} />
      {env.enableDevRoutes ? <Stack.Screen name="dev" options={{ headerShown: false }} /> : null}
    </Stack>
  );
}
