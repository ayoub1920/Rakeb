import { useRouter, useRootNavigationState, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { env } from '@/config/env';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Navigation protection.
 *
 * Mounted once, in the root layout. It watches the current segments against the
 * auth status and redirects:
 *
 *   signed out, outside `(auth)`  → `/(auth)/welcome`
 *   signed in,  inside  `(auth)`  → `/(tabs)`
 *
 * It deliberately does not run while the status is `loading`: redirecting
 * during session restoration would flash the welcome screen on every cold
 * start for users who are already signed in.
 *
 * An alternative is Expo Router's declarative `<Stack.Protected guard={…}>`.
 * The imperative version is used here because the redirect target will grow
 * conditions (onboarding not finished, phone not verified, app update
 * required), and those are easier to express as code than as nested guards.
 */

/** Segment groups reachable without a session. */
const PUBLIC_GROUPS = new Set(['(auth)']);

export function useProtectedRoute(): void {
  const segments = useSegments();
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Navigating before the root navigator has mounted throws.
    if (!navigationState?.key) return;
    if (status === 'loading') return;

    const group = segments[0];
    const inPublicGroup = group !== undefined && PUBLIC_GROUPS.has(group);
    const inDevRoutes = env.enableDevRoutes && group === 'dev';

    if (status === 'unauthenticated' && !inPublicGroup && !inDevRoutes) {
      router.replace('/(auth)/welcome');
      return;
    }

    if (status === 'authenticated' && inPublicGroup) {
      router.replace('/(tabs)');
    }
  }, [status, segments, router, navigationState?.key]);
}
