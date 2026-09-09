import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { getNextCursor, INITIAL_CURSOR } from '@/api/pagination';
import { STALE_TIME } from '@/api/query-client';
import { QUERY_SCOPES } from '@/api/query-keys';
import { useIsAuthenticated } from '@/auth/use-auth';
import type { ApiError, CursorPage } from '@/types/api';
import type {
  BookingRequest,
  DriverTripBucket,
  Id,
  IsoDate,
  PriceSuggestion,
  Trip,
  TripSummary,
} from '@/types/models';

import {
  acceptBooking,
  cancelTrip,
  completeTrip,
  declineBooking,
  getBookingRequests,
  getMyTrips,
  getPriceSuggestion,
  markNoShow,
  publishTrip,
  publishTripDraft,
  startTrip,
  updateTrip,
  type CompleteTripResult,
  type PublishDraft,
  type StartTripResult,
  type UpdateTripInput,
} from './api';
import { publishingKeys } from './keys';

/** `GET /trips/price-suggestion`. `enabled` waits for both places to be chosen. */
export function usePriceSuggestion(from?: Id | null, to?: Id | null, date?: IsoDate | null) {
  return useQuery<PriceSuggestion, ApiError>({
    queryKey: publishingKeys.priceSuggestion(from ?? '', to ?? '', date ?? ''),
    queryFn: ({ signal }) =>
      getPriceSuggestion({ from_place_id: from as Id, to_place_id: to as Id, date: date ?? undefined }, { signal }),
    enabled: Boolean(from) && Boolean(to),
    staleTime: STALE_TIME.static,
  });
}

/**
 * `POST /trips`.
 *
 * On success, invalidates the driver's trip lists and the search caches (a new
 * trip is now findable). The caller clears the draft store.
 */
export function usePublishTrip() {
  const queryClient = useQueryClient();

  return useMutation<Trip, ApiError, PublishDraft>({
    mutationFn: (draft) => publishTrip(draft),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: publishingKeys.all });
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.tripSearch] });
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.trips] });
    },
  });
}

/** `GET /me/trips?status=`. */
export function useMyTrips(status: DriverTripBucket) {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<TripSummary[], ApiError>({
    queryKey: publishingKeys.myTrips(status),
    queryFn: ({ signal }) => getMyTrips(status, { signal }),
    enabled: isAuthenticated,
    staleTime: STALE_TIME.volatile,
    refetchOnMount: 'always',
  });
}

export function useUpdateTrip(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation<Trip, ApiError, UpdateTripInput>({
    mutationFn: (input) => updateTrip(tripId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: publishingKeys.all });
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.trips] });
    },
  });
}

export function useCancelTrip(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (reason) => cancelTrip(tripId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: publishingKeys.all });
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.trips] });
    },
  });
}

/**
 * `GET /me/booking-requests`.
 *
 * `refetchOnMount` because a request expires on its own after 24 h and the
 * driver must not answer a stale one.
 */
export function useBookingRequests(tripId: Id | null, status = 'pending') {
  const isAuthenticated = useIsAuthenticated();

  return useInfiniteQuery<CursorPage<BookingRequest>, ApiError>({
    queryKey: publishingKeys.requests(tripId, status),
    queryFn: ({ pageParam, signal }) =>
      getBookingRequests({ trip_id: tripId, status }, pageParam as string | null, { signal }),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: getNextCursor,
    enabled: isAuthenticated,
    staleTime: STALE_TIME.volatile,
    refetchOnMount: 'always',
  });
}

/** `POST /bookings/{id}/accept` — invalidates the requests inbox and the trip lists. */
export function useAcceptBooking() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (bookingId) => acceptBooking(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: publishingKeys.all });
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.bookings] });
      // Accepting opens the conversation and can flip the trip to `full`.
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.conversations] });
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.trips] });
    },
  });
}

/** `POST /bookings/{id}/decline`. */
export function useDeclineBooking() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { bookingId: string; reason: string }>({
    mutationFn: ({ bookingId, reason }) => declineBooking(bookingId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: publishingKeys.all });
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.bookings] });
      // A declined request frees the held seat back onto the trip.
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.trips] });
    },
  });
}

/**
 * `POST /trips/{id}/start`. Pass no code to start the carpool; pass a 4-digit
 * `passenger_code` to check a passenger in. Invalidates the trip caches so the
 * screen flips from "Démarrer" to "Terminer" straight away.
 */
export function useStartTrip(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation<StartTripResult, ApiError, string | undefined>({
    mutationFn: (passengerCode) => startTrip(tripId, passengerCode),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: publishingKeys.all });
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.trips] });
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.bookings] });
    },
  });
}

/** `POST /trips/{id}/publish` — promotes a draft. */
export function usePublishDraft(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation<Trip, ApiError, void>({
    mutationFn: () => publishTripDraft(tripId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: publishingKeys.all });
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.trips] });
    },
  });
}

/** `POST /bookings/{id}/no-show` — driver marks a passenger absent. */
export function useMarkNoShow(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (bookingId) => markNoShow(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: publishingKeys.requests(tripId, 'confirmed') });
      void queryClient.invalidateQueries({ queryKey: publishingKeys.all });
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.bookings] });
    },
  });
}

export function useCompleteTrip(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation<CompleteTripResult, ApiError, void>({
    mutationFn: () => completeTrip(tripId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: publishingKeys.all });
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.trips] });
    },
  });
}
