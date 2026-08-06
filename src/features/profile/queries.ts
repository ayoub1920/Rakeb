import { useQuery } from '@tanstack/react-query';

import { STALE_TIME } from '@/api/query-client';
import { useIsAuthenticated } from '@/auth/use-auth';
import type { ApiError } from '@/types/api';
import type { User } from '@/types/models';

import { getCurrentUser } from './api';
import { profileKeys } from './keys';

/**
 * `GET /me`.
 *
 * Gated on the auth status: firing it while signed out would produce a
 * guaranteed 401, an attempted refresh, and a redirect the router is already
 * handling.
 */
export function useCurrentUser() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<User, ApiError>({
    queryKey: profileKeys.currentUser(),
    queryFn: ({ signal }) => getCurrentUser({ signal }),
    enabled: isAuthenticated,
    staleTime: STALE_TIME.session,
  });
}
