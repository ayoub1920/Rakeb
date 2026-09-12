import { toCursorParams } from '@/api/pagination';
import { apiGet } from '@/api/request';
import type { MapMarker, MapPolyline } from '@/services/maps/types';
import type { CursorPage, RequestOptions } from '@/types/api';
import type {
  PaginatedResponse,
  TripMapResponse,
  TripSummaryResponse,
} from '@/types/api-responses';
import type { Coordinates, TripSummary } from '@/types/models';

import { toTripSummary } from '../trips/mappers';
import type { TripSearchParams } from './types';

/**
 * Trip search — `API Rakeb.md` §4.
 *
 * Not implemented (add here):
 *   GET · DELETE /me/recent-searches
 *   GET · POST · DELETE /me/trip-alerts
 *
 * `/places/autocomplete` belongs to `features/places` (platform-level), not
 * here — it is also used by the driver publish flow and by taxi search.
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

/** Search results shaped for the map view: markers plus one route per trip. */
export type TripSearchMapData = {
  markers: MapMarker[];
  polylines: MapPolyline[];
  total: number;
};

/**
 * `GET /trips/search/map`.
 *
 * Same filters as `/trips/search`, but returns origin/destination markers and a
 * decoded route polyline per trip — the real geometry `rakeb-backend` computed
 * (great-circle for `MAPS_PROVIDER=local`, real roads for `google`). The list
 * view uses `searchTrips`; the map toggle uses this.
 */
export async function getTripSearchMap(
  params: TripSearchParams,
  options?: RequestOptions,
): Promise<TripSearchMapData> {
  const res = await apiGet<TripMapResponse>(
    '/trips/search/map',
    {
      ...params,
      filters: params.filters?.length ? params.filters.join(',') : undefined,
    },
    options,
  );

  const markers: MapMarker[] = res.markers.map((marker) => ({
    id: `${marker.trip_id}:${marker.kind}`,
    coordinate: { latitude: marker.lat, longitude: marker.lng },
    kind: marker.kind === 'destination' ? 'destination' : 'origin',
  }));

  const polylines: MapPolyline[] = Object.entries(res.polylines).map(([tripId, line]) => ({
    id: tripId,
    coordinates: line.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
  }));

  return { markers, polylines, total: res.total };
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
