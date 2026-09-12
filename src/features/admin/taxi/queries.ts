import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getNextCursor, INITIAL_CURSOR } from '@/api/pagination';
import { STALE_TIME } from '@/api/query-client';
import { useIsAuthenticated } from '@/auth/use-auth';
import { useIsAdmin } from '@/features/profile/queries';
import type { AdminTaxiApplication, AdminTaxiRide, TaxiApplicationStatus, TaxiRideStatus } from '@/features/taxi/types';
import type { ApiError, CursorPage } from '@/types/api';

import {
  approveTaxiApplication,
  getAdminTaxiApplication,
  getAdminTaxiRide,
  listAdminTaxiApplications,
  listAdminTaxiRides,
  rejectTaxiApplication,
} from './api';
import { adminTaxiKeys } from './keys';

/** `GET /admin/taxi/applications?status=` — `pending` by default. */
export function useAdminTaxiApplications(status: TaxiApplicationStatus | undefined) {
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();

  return useInfiniteQuery<CursorPage<AdminTaxiApplication>, ApiError>({
    queryKey: adminTaxiKeys.applications(status),
    queryFn: ({ pageParam, signal }) =>
      listAdminTaxiApplications(status, pageParam as string | null, { signal }),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: getNextCursor,
    enabled: isAuthenticated && isAdmin,
    staleTime: STALE_TIME.volatile,
    refetchOnMount: 'always',
  });
}

export function useAdminTaxiApplication(userId: string) {
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();

  return useQuery<AdminTaxiApplication, ApiError>({
    queryKey: adminTaxiKeys.application(userId),
    queryFn: ({ signal }) => getAdminTaxiApplication(userId, { signal }),
    enabled: isAuthenticated && isAdmin && Boolean(userId),
    staleTime: STALE_TIME.volatile,
  });
}

export function useApproveTaxiApplication(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, void>({
    mutationFn: () => approveTaxiApplication(userId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminTaxiKeys.all }),
  });
}

/** A reason is required — the backend enforces it, the UI does too. */
export function useRejectTaxiApplication(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (reason) => rejectTaxiApplication(userId, reason),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminTaxiKeys.all }),
  });
}

/** `GET /admin/taxi/rides?status=` — oversight list. */
export function useAdminTaxiRides(status: TaxiRideStatus | undefined) {
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();

  return useInfiniteQuery<CursorPage<AdminTaxiRide>, ApiError>({
    queryKey: adminTaxiKeys.rides(status),
    queryFn: ({ pageParam, signal }) => listAdminTaxiRides(status, pageParam as string | null, { signal }),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: getNextCursor,
    enabled: isAuthenticated && isAdmin,
    staleTime: STALE_TIME.volatile,
  });
}

export function useAdminTaxiRide(rideId: string) {
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();

  return useQuery<AdminTaxiRide, ApiError>({
    queryKey: adminTaxiKeys.ride(rideId),
    queryFn: ({ signal }) => getAdminTaxiRide(rideId, { signal }),
    enabled: isAuthenticated && isAdmin && Boolean(rideId),
    staleTime: STALE_TIME.volatile,
  });
}
