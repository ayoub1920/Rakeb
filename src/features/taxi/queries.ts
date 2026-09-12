import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getNextCursor, INITIAL_CURSOR } from '@/api/pagination';
import { STALE_TIME } from '@/api/query-client';
import { useIsAuthenticated } from '@/auth/use-auth';
import type { ApiError, CursorPage } from '@/types/api';

import {
  acceptTaxiRide,
  cancelTaxiRide,
  createTaxiRide,
  getMyTaxiApplication,
  getTaxiRide,
  getTaxiRideTracking,
  listAvailableTaxiRides,
  listMyTaxiRides,
  pushTaxiDriverLocation,
  quoteTaxiRide,
  setTaxiAvailability,
  submitTaxiApplication,
  updateTaxiRideStatus,
  type SubmitTaxiApplicationInput,
  type TaxiDriverLocation,
  type TaxiRideRequestInput,
} from './api';
import { taxiApplicationKeys, taxiDispatchKeys, taxiQuoteKeys, taxiRideKeys } from './keys';
import type {
  TaxiApplication,
  TaxiRide,
  TaxiRideQuote,
  TaxiRideStatus,
  TaxiRideSummary,
  TaxiTracking,
} from './types';

// --- driver application -----------------------------------------------

/**
 * `GET /me/taxi/application`.
 *
 * A 404 means "no application yet" — a normal, expected outcome (the driver
 * landing screen and `/taxi/driver/_layout.tsx` both branch on it), so it is
 * surfaced as `data === undefined` via `retry: false` rather than treated as
 * a transient error worth retrying.
 */
export function useTaxiApplication() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<TaxiApplication, ApiError>({
    queryKey: taxiApplicationKeys.mine(),
    queryFn: ({ signal }) => getMyTaxiApplication({ signal }),
    enabled: isAuthenticated,
    staleTime: STALE_TIME.session,
    retry: false,
  });
}

export function useSubmitTaxiApplication() {
  const queryClient = useQueryClient();

  return useMutation<TaxiApplication, ApiError, SubmitTaxiApplicationInput>({
    mutationFn: (input) => submitTaxiApplication(input),
    onSuccess: (application) => {
      queryClient.setQueryData(taxiApplicationKeys.mine(), application);
    },
  });
}

export function useSetTaxiAvailability() {
  const queryClient = useQueryClient();

  return useMutation<TaxiApplication, ApiError, boolean>({
    mutationFn: (isOnline) => setTaxiAvailability(isOnline),
    onSuccess: (application) => {
      queryClient.setQueryData(taxiApplicationKeys.mine(), application);
    },
  });
}

export function usePushTaxiDriverLocation() {
  return useMutation<{ accepted: true }, ApiError, TaxiDriverLocation>({
    mutationFn: (position) => pushTaxiDriverLocation(position),
  });
}

// --- rides --------------------------------------------------------------

/** `POST /taxi/rides/quote` — a mutation, not a query: it runs on demand, not on a key change. */
export function useTaxiQuote() {
  return useMutation<TaxiRideQuote, ApiError, TaxiRideRequestInput>({
    mutationFn: (input) => quoteTaxiRide(input),
  });
}

/**
 * `POST /taxi/rides`. Seeds the detail cache so the ride screen it navigates
 * to paints immediately, then invalidates the rider's ride list.
 */
export function useCreateTaxiRide() {
  const queryClient = useQueryClient();

  return useMutation<TaxiRide, ApiError, TaxiRideRequestInput>({
    mutationFn: (input) => createTaxiRide(input),
    onSuccess: (ride) => {
      queryClient.setQueryData(taxiRideKeys.detail(ride.id), ride);
      void queryClient.invalidateQueries({ queryKey: taxiRideKeys.all });
    },
  });
}

/** `GET /taxi/rides/{id}`. Realtime tier — a ride's status moves under the user. */
export function useTaxiRide(rideId: string | undefined) {
  return useQuery<TaxiRide, ApiError>({
    queryKey: taxiRideKeys.detail(rideId ?? ''),
    queryFn: ({ signal }) => getTaxiRide(rideId as string, { signal }),
    enabled: Boolean(rideId),
    staleTime: STALE_TIME.realtime,
    refetchInterval: 10_000,
  });
}

/** `GET /taxi/rides/{id}/tracking` — polling fallback for `/ws/taxi`. */
export function useTaxiRideTracking(rideId: string | undefined, active = true) {
  return useQuery<TaxiTracking, ApiError>({
    queryKey: taxiRideKeys.tracking(rideId ?? ''),
    queryFn: ({ signal }) => getTaxiRideTracking(rideId as string, { signal }),
    enabled: Boolean(rideId) && active,
    staleTime: STALE_TIME.realtime,
    refetchInterval: active ? 5_000 : false,
  });
}

/** `GET /taxi/rides/available` — driver-side, polled as a fallback to the push notification. */
export function useAvailableTaxiRides(enabled: boolean) {
  return useQuery<TaxiRideSummary[], ApiError>({
    queryKey: taxiDispatchKeys.available(),
    queryFn: ({ signal }) => listAvailableTaxiRides(undefined, { signal }),
    enabled,
    staleTime: STALE_TIME.realtime,
    refetchInterval: enabled ? 8_000 : false,
  });
}

/** `GET /taxi/rides?role=&status=` — infinite list, own rides. */
export function useMyTaxiRides(role: 'rider' | 'driver', status?: TaxiRideStatus) {
  const isAuthenticated = useIsAuthenticated();

  return useInfiniteQuery<CursorPage<TaxiRideSummary>, ApiError>({
    queryKey: taxiRideKeys.list(role, status),
    queryFn: ({ pageParam, signal }) =>
      listMyTaxiRides(role, status, pageParam as string | null, { signal }),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: getNextCursor,
    enabled: isAuthenticated,
    staleTime: STALE_TIME.volatile,
  });
}

function invalidateRide(queryClient: ReturnType<typeof useQueryClient>, ride: TaxiRide): void {
  queryClient.setQueryData(taxiRideKeys.detail(ride.id), ride);
  void queryClient.invalidateQueries({ queryKey: taxiRideKeys.all });
  void queryClient.invalidateQueries({ queryKey: taxiDispatchKeys.all });
}

export function useAcceptTaxiRide() {
  const queryClient = useQueryClient();

  return useMutation<TaxiRide, ApiError, string>({
    mutationFn: (rideId) => acceptTaxiRide(rideId),
    onSuccess: (ride) => invalidateRide(queryClient, ride),
  });
}

export function useUpdateTaxiRideStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    TaxiRide,
    ApiError,
    { rideId: string; status: Parameters<typeof updateTaxiRideStatus>[1] }
  >({
    mutationFn: ({ rideId, status }) => updateTaxiRideStatus(rideId, status),
    onSuccess: (ride) => invalidateRide(queryClient, ride),
  });
}

export function useCancelTaxiRide() {
  const queryClient = useQueryClient();

  return useMutation<TaxiRide, ApiError, { rideId: string; reason?: string }>({
    mutationFn: ({ rideId, reason }) => cancelTaxiRide(rideId, reason),
    onSuccess: (ride) => invalidateRide(queryClient, ride),
  });
}

// Re-exported so screens don't need a second import from './keys' for cache seeding.
export { taxiApplicationKeys, taxiDispatchKeys, taxiQuoteKeys, taxiRideKeys };
