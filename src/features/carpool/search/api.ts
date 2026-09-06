import { toCursorParams } from '@/api/pagination';
import { apiGet } from '@/api/request';
import type { CursorPage, RequestOptions } from '@/types/api';
import type { PaginatedResponse, TripSummaryResponse } from '@/types/api-responses';
import type { Coordinates, TripSummary } from '@/types/models';

import { toTripSummary } from '../trips/mappers';
import type { TripSearchParams } from './types';

/**
 * Trip search — `API Rakeb.md` §4.
 *
 * Not implemented (add here):
 *   GET /trips/search/map
 *   GET · DELETE /me/recent-searches
 *   GET · POST · DELETE /me/trip-alerts
 *
 * `/places/autocomplete` belongs to `features/carpool/places`, not here — it is
 * also used by the driver publish flow.
 */

/**
 * `GET /trips/search`.
 *
 * Results are volatile: `seats_available` can be consumed by another passenger
 * between this response and the booking request. Treat "plus de place" at
 * booking time as an expected outcome, not an error.
 */
export async function searchTrips(
  params: TripSearchParams,
  cursor?: string | null,
  options?: RequestOptions,
): Promise<CursorPage<TripSummary>> {
  const page = await apiGet<PaginatedResponse<TripSummaryResponse>>(
    '/trips/search',
    {
      ...params,
      filters: params.filters?.length ? params.filters.join(',') : undefined,
      ...toCursorParams(cursor),
    },
    options,
  );
  return {
    items: page.items.map(toTripSummary),
    next_cursor: page.next_cursor,
    total: page.total,
  };
}

/**
 * `GET /trips/nearby?lat=&lng=`.
 *
 * A short, curated list for the home screen — not paginated, and not the search
 * result set. Coordinates come from `services/location` only after the user
 * asks for "trajets près de moi"; this function never prompts for permission
 * itself.
 */
export async function getNearbyTrips(
  coords: Coordinates,
  options?: RequestOptions,
): Promise<TripSummary[]> {
  const rows = await apiGet<TripSummaryResponse[]>(
    '/trips/nearby',
    { lat: coords.lat, lng: coords.lng },
    options,
  );
  return rows.map(toTripSummary);
}
