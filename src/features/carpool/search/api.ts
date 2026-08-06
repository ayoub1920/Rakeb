import { toCursorParams } from '@/api/pagination';
import { apiGet } from '@/api/request';
import type { CursorPage, RequestOptions } from '@/types/api';
import type { TripSummary } from '@/types/models';

import type { TripSearchParams } from './types';

/**
 * Trip search — `API Rakeb.md` §4.
 *
 * Not implemented (add here):
 *   GET /trips/search/map · GET /trips/nearby
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
export function searchTrips(
  params: TripSearchParams,
  cursor?: string | null,
  options?: RequestOptions,
): Promise<CursorPage<TripSummary>> {
  return apiGet<CursorPage<TripSummary>>(
    '/trips/search',
    {
      ...params,
      filters: params.filters?.length ? params.filters.join(',') : undefined,
      ...toCursorParams(cursor),
    },
    options,
  );
}
