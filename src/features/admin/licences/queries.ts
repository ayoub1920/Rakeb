import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getNextCursor, INITIAL_CURSOR } from '@/api/pagination';
import { STALE_TIME } from '@/api/query-client';
import { useIsAuthenticated } from '@/auth/use-auth';
import { useIsAdmin } from '@/features/profile/queries';
import type { ApiError, CursorPage } from '@/types/api';
import type { LicenceReviewStatus, LicenceVerification } from '@/types/models';

import {
  approveLicenceVerification,
  getLicenceVerification,
  getLicenceVerifications,
  rejectLicenceVerification,
} from './api';
import { adminLicenceKeys } from './keys';

/**
 * `GET /admin/verifications?type=licence&status=`.
 *
 * `STALE_TIME.volatile`: the queue changes as other admins review
 * submissions, and it is small enough that a short refetch window costs
 * nothing.
 */
export function useLicenceVerifications(status: LicenceReviewStatus | undefined) {
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();

  return useInfiniteQuery<CursorPage<LicenceVerification>, ApiError>({
    queryKey: adminLicenceKeys.list(status),
    queryFn: ({ pageParam, signal }) =>
      getLicenceVerifications(status, pageParam as string | null, { signal }),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: getNextCursor,
    enabled: isAuthenticated && isAdmin,
    staleTime: STALE_TIME.volatile,
    refetchOnMount: 'always',
  });
}

/** `GET /admin/verifications/{userId}/licence`. */
export function useLicenceVerification(userId: string) {
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();

  return useQuery<LicenceVerification, ApiError>({
    queryKey: adminLicenceKeys.detail(userId),
    queryFn: ({ signal }) => getLicenceVerification(userId, { signal }),
    enabled: isAuthenticated && isAdmin && Boolean(userId),
    staleTime: STALE_TIME.volatile,
  });
}

/** `POST /admin/verifications/{userId}/licence/review` — approve. */
export function useApproveLicenceVerification(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, void>({
    mutationFn: () => approveLicenceVerification(userId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminLicenceKeys.all }),
  });
}

/** `POST /admin/verifications/{userId}/licence/review` — reject. A reason is required. */
export function useRejectLicenceVerification(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (reason) => rejectLicenceVerification(userId, reason),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminLicenceKeys.all }),
  });
}
