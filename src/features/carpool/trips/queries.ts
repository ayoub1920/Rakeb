import { useQuery } from '@tanstack/react-query';

import { STALE_TIME } from '@/api/query-client';
import type { ApiError } from '@/types/api';
import type { Quote, Trip, TripSeat } from '@/types/models';

import { getQuote, getSeatMap, getTrip, type QuoteInput } from './api';
import { tripKeys } from './keys';

/**
 * `GET /trips/{id}`.
 *
 * `STALE_TIME.volatile` because seat availability is shown on this screen and
 * a stale count leads a passenger into a booking that will be rejected.
 */
export function useTrip(tripId: string | undefined) {
  return useQuery<Trip, ApiError>({
    queryKey: tripKeys.detail(tripId ?? ''),
    queryFn: ({ signal }) => getTrip(tripId as string, { signal }),
    enabled: Boolean(tripId),
    staleTime: STALE_TIME.volatile,
  });
}

/**
 * `GET /trips/{id}/seat-map`.
 *
 * Volatile for the same reason as the trip: another passenger can take a seat
 * between opening the screen and confirming.
 */
export function useSeatMap(tripId: string | undefined) {
  return useQuery<TripSeat[], ApiError>({
    queryKey: tripKeys.seatMap(tripId ?? ''),
    queryFn: ({ signal }) => getSeatMap(tripId as string, { signal }),
    enabled: Boolean(tripId),
    staleTime: STALE_TIME.volatile,
  });
}

/**
 * `POST /trips/{id}/quote`.
 *
 * Keyed on the full input so changing the seat count or promo code is a fresh
 * quote rather than a stale one. `realtime` staleness: a fare must never be
 * shown from cache once an input changed.
 */
export function useQuote(tripId: string | undefined, input: QuoteInput, enabled = true) {
  return useQuery<Quote, ApiError>({
    queryKey: [...tripKeys.detail(tripId ?? ''), 'quote', input] as const,
    queryFn: ({ signal }) => getQuote(tripId as string, input, { signal }),
    enabled: Boolean(tripId) && enabled && input.seats > 0,
    staleTime: STALE_TIME.realtime,
  });
}
