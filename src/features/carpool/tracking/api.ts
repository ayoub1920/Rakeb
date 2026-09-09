import { apiGet, apiPost } from '@/api/request';
import type { RequestOptions } from '@/types/api';
import type { TrackingResponse } from '@/types/api-responses';
import type { Coordinates, TrackingState, TripTracking } from '@/types/models';

/**
 * Live trip position and state — `API Rakeb.md` §8.
 *
 * `GET /trips/{id}/tracking` is the polling fallback and the source of truth.
 * `WS /ws/trips/{id}` is an enhancement layered on top by the query hook; the
 * screen must render correctly with the socket disconnected.
 *
 * `POST /trips/{id}/position` is the driver's uplink while the trip is
 * `in_progress` — see `use-driver-position-broadcast`.
 */

function toState(tripStatus: string): TrackingState {
  if (tripStatus === 'in_progress') return 'in_progress';
  if (tripStatus === 'completed') return 'completed';
  return 'not_started';
}

export async function getTripTracking(
  tripId: string,
  options?: RequestOptions,
): Promise<TripTracking> {
  const dto = await apiGet<TrackingResponse>(`/trips/${tripId}/tracking`, undefined, options);
  const etaMinutes = dto.eta_at
    ? Math.max(0, Math.round((new Date(dto.eta_at).getTime() - Date.now()) / 60_000))
    : null;

  return {
    trip_id: dto.trip_id,
    state: toState(dto.trip_status),
    driver_location: dto.position ? { lat: dto.position.lat, lng: dto.position.lng } : null,
    eta_minutes: etaMinutes,
    remaining_distance_m: dto.remaining_distance_m,
    traffic: dto.traffic,
    live: dto.live,
  };
}

export type DriverPosition = Coordinates & { heading?: number; speed?: number; accuracy?: number };

/**
 * `POST /trips/{id}/position` — the driver's app pushes its location while the
 * trip is `in_progress`. Rejected (409 `TRACKING_TRIP_NOT_ACTIVE`) otherwise.
 */
export function pushDriverPosition(
  tripId: string,
  position: DriverPosition,
  options?: RequestOptions,
): Promise<void> {
  return apiPost<void>(
    `/trips/${tripId}/position`,
    {
      lat: position.lat,
      lng: position.lng,
      heading: position.heading,
      speed: position.speed,
      accuracy: position.accuracy,
    },
    options,
  );
}
