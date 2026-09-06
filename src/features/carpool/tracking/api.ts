import { apiGet } from '@/api/request';
import type { RequestOptions } from '@/types/api';
import type { TrackingResponse } from '@/types/api-responses';
import type { TrackingState, TripTracking } from '@/types/models';

/**
 * Live trip position and state — `API Rakeb.md` §8.
 *
 * `GET /trips/{id}/tracking` is the polling fallback and the source of truth.
 * `WS /ws/trips/{id}` is an enhancement layered on top by the query hook; the
 * screen must render correctly with the socket disconnected.
 *
 * Not implemented (add here):
 *   POST /trips/{id}/position — driver side, belongs to publishing
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
    traffic: dto.traffic,
    live: dto.live,
  };
}
