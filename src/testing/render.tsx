import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import { AppProviders } from '@/providers/AppProviders';

/**
 * Test rendering helpers.
 *
 * `renderWithProviders` mounts the real provider tree, so a test exercises the
 * same wiring the app does. Use `renderWithQueryClient` for a hook that only
 * needs a cache — mounting auth and i18n for a query test just makes failures
 * harder to read.
 */

/**
 * A query client tuned for tests: no retries (a failing request should fail the
 * test immediately, not three seconds later) and no cache carried between cases.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  queryClient?: QueryClient;
};

/** Renders inside the full app provider tree. */
export function renderWithProviders(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...options }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <AppProviders queryClient={queryClient}>{children}</AppProviders>;
  }

  return { queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
}

/** Wrapper for `renderHook` when only TanStack Query is needed. */
export function createQueryWrapper(queryClient: QueryClient = createTestQueryClient()) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { Wrapper, queryClient };
}

export * from '@testing-library/react-native';
