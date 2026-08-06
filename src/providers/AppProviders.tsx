import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createQueryClient } from '@/api/query-client';
import { AuthProvider } from '@/auth/AuthProvider';
import { assertEnvIsUsable } from '@/config/env';
import { i18n, initI18n } from '@/localization/i18n';

/**
 * The provider tree, in the only order that works:
 *
 *   GestureHandlerRootView  — must be the outermost native view
 *     SafeAreaProvider      — insets, needed by `Screen`
 *       QueryClientProvider — AuthProvider clears the cache on sign-out
 *         I18nextProvider   — translations available to auth screens
 *           AuthProvider    — restores the session, guards navigation
 *
 * `queryClient` is injectable so tests get a fresh cache per case; the app
 * never passes it.
 */

export type AppProvidersProps = {
  children: ReactNode;
  queryClient?: QueryClient;
};

assertEnvIsUsable();
initI18n();

export function AppProviders({ children, queryClient }: AppProvidersProps) {
  const client = useMemo(() => queryClient ?? createQueryClient(), [queryClient]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={client}>
          <I18nextProvider i18n={i18n}>
            <AuthProvider>{children}</AuthProvider>
          </I18nextProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
