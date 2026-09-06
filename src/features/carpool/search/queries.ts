import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { getNextCursor, INITIAL_CURSOR } from '@/api/pagination';
import { STALE_TIME } from '@/api/query-client';
import type { ApiError, CursorPage } from '@/types/api';
import type { Coordinates, TripSummary } from '@/types/models';

import { getNearbyTrips, searchTrips } from './api';
import { tripSearchKeys } from './keys';
import type { TripSearchParams } from './types';

/**
 * `GET /trips/search`, paginated.
 *
 * The canonical infinite query for the app — every other cursor-paginated list
 * (bookings, messages, reviews, wallet transactions) follows this exact shape.
 *
 * `enabled` lets the results screen mount before both places are chosen without
 * firing an incomplete request.
 */
export function useTripSearch(params: TripSearchParams | null) {
  return useInfiniteQuery<CursorPage<TripSummary>, ApiError>({
    queryKey: tripSearchKeys.results(params ?? ({} as TripSearchParams)),
    queryFn: ({ pageParam, signal }) =>
      searchTrips(params as TripSearchParams, pageParam as string | null, { signal }),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: getNextCursor,
    enabled: params !== null,
    staleTime: STALE_TIME.volatile,
  });
}

/**
 * `GET /trips/nearby`.
 *
 * `enabled` is the location gate: the home screen passes `null` until the user
 * taps "trajets près de moi" and permission resolves to a position. Volatile
 * staleness for the same reason as search — seat counts move under the user.
 */
export function useNearbyTrips(coords: Coordinates | null) {
  return useQuery<TripSummary[], ApiError>({
    queryKey: tripSearchKeys.nearby(coords?.lat ?? 0, coords?.lng ?? 0),
    queryFn: ({ signal }) => getNearbyTrips(coords as Coordinates, { signal }),
    enabled: coords !== null,
    staleTime: STALE_TIME.volatile,
  });
}
