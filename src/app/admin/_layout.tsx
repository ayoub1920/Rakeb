import { Redirect, Stack } from 'expo-router';

import { LoadingView } from '@/components';
import { useCurrentUser, useIsAdmin } from '@/features/profile/queries';
import { colors } from '@/theme';

/**
 * Admin routes, gated on `role === 'admin'`.
 *
 * Mirrors `app/dev/_layout.tsx`: the guard lives in the group layout so the
 * routes are unreachable by deep link, not just hidden from navigation. This
 * is UX only — it saves a non-admin an extra round trip to find out they
 * cannot see this screen. The actual boundary is server-side: every
 * `/admin/*` endpoint (`src/api/mock/routes.ts` today, the real backend once
 * it exists) rejects a non-admin with `403` regardless of what this layout
 * does.
 */
export default function AdminLayout() {
  const { isLoading } = useCurrentUser();
  const isAdmin = useIsAdmin();

  // `GET /me` hasn't resolved yet — wait rather than redirect a soon-to-be-admin.
  if (isLoading) {
    return <LoadingView />;
  }

  if (!isAdmin) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.brand.primary,
        headerTitleStyle: { color: colors.text.primary },
      }}
    />
  );
}
