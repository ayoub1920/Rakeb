import { apiGet } from '@/api/request';
import type { RequestOptions } from '@/types/api';
import type { Trip } from '@/types/models';

/**
 * Trip read model — `API Rakeb.md` §5.
 *
 * Shared by both sides: a passenger opens a trip from search results, a driver
 * opens their own from `/me/trips`. Driver *mutations* (publish, edit, start,
 * complete) belong to `features/carpool/publishing`.
 *
 * Not implemented (add here):
 *   GET  /trips/{id}/seat-map
 *   POST /trips/{id}/quote
 */

/** `GET /trips/{id}` — itinerary, stops, vehicle, driver, cancellation policy. */
export function getTrip(tripId: string, options?: RequestOptions): Promise<Trip> {
  return apiGet<Trip>(`/trips/${tripId}`, undefined, options);
}
