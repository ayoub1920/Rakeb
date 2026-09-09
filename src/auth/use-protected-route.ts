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
 * Two routes are exempt from the second rule: `/(auth)/otp` and
 * `/(auth)/register`. Per `docs/API_FRONTEND_ANALYSIS.md` §4,
 * `/auth/phone/verify` already returns a session for a brand-new user, and the
 * OTP screen signs in immediately — the profile just isn't complete yet. The
 * OTP screen then navigates itself (to `(tabs)` for a returning user, to
 * `register` for a new one). Without exempting `otp`, this guard fires
 * `replace('/(tabs)')` in the same tick the screen fires
 * `replace('/(auth)/register')`, and whichever loses drops a new user on the
 * tabs with an incomplete profile.
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
    const route = segments[1];
    const inPublicGroup = group !== undefined && PUBLIC_GROUPS.has(group);
    const inDevRoutes = env.enableDevRoutes && group === 'dev';
    // The OTP screen and Register own their own post-sign-in navigation.
    const isAuthHandoff = group === '(auth)' && (route === 'otp' || route === 'register');

    if (status === 'unauthenticated' && !inPublicGroup && !inDevRoutes) {
      router.replace('/(auth)/welcome');
      return;
    }

    if (status === 'authenticated' && inPublicGroup && !isAuthHandoff) {
      router.replace('/(tabs)');
    }
  }, [status, segments, router, navigationState?.key]);
}
