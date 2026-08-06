import { QueryClient } from '@tanstack/react-query';

import { isApiError, isRetryableError } from './errors';

/**
 * TanStack Query configuration.
 *
 * The defaults below are deliberately conservative; per-query `staleTime` is
 * chosen from `STALE_TIME` at the call site. See "Cache strategy per data
 * class" in `docs/API_FRONTEND_ANALYSIS.md` for why each class differs.
 */

/** Named staleness tiers. Pick one per query instead of inventing a number. */
export const STALE_TIME = {
  /** `/services`, `/config`, `/reviews/tags` — changes on deploy. */
  static: 60 * 60 * 1000,
  /** `/me`, `/me/preferences` — changes only through the user's own mutations. */
  session: 5 * 60 * 1000,
  /** `/trips/search` — seat availability moves under the user. */
  volatile: 30 * 1000,
  /** `/wallet`, tracking — always refetch. */
  realtime: 0,
} as const;

const MAX_RETRIES = 2;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME.session,
        gcTime: 15 * 60 * 1000,
        // Only network and 5xx failures are worth retrying; a 401 must reach
        // the auth layer immediately and a 4xx will fail identically forever.
        retry: (failureCount, error) => {
          if (failureCount >= MAX_RETRIES) return false;
          return isApiError(error) ? isRetryableError(error) : false;
        },
        // Mobile apps resume from background constantly; refetching on every
        // focus is the wrong default and is opted into per query instead.
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        // A mutation is never safely retryable without an idempotency key,
        // and the API does not document one yet.
        retry: false,
      },
    },
  });
}
