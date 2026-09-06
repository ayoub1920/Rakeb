import { useQuery } from '@tanstack/react-query';

import { STALE_TIME } from '@/api/query-client';
import type { ApiError } from '@/types/api';
import type { TripTracking } from '@/types/models';

import { getTripTracking } from './api';
import { trackingKeys } from './keys';

/** How often the polling fallback re-reads position while the screen is open. */
const TRACKING_POLL_MS = 10_000;

/**
 * `GET /trips/{id}/tracking`, polled.
 *
 * Polling is the documented fallback and is wired first so the screen is
 * correct without a socket. The `WS /ws/trips/{id}` enhancement — connect on
 * mount, push `position` / `eta_updated` into this cache with
 * `queryClient.setQueryData`, disconnect on unmount — is a follow-up; see
 * `features/carpool/tracking/README.md`.
 *
 * `realtime` staleness and `refetchInterval` because a stale position on this
 * screen is the one thing it must never show.
 */
export function useTripTracking(tripId: string | undefined, active = true) {
  return useQuery<TripTracking, ApiError>({
    queryKey: trackingKeys.trip(tripId ?? ''),
    queryFn: ({ signal }) => getTripTracking(tripId as string, { signal }),
    enabled: Boolean(tripId) && active,
    staleTime: STALE_TIME.realtime,
    refetchInterval: active ? TRACKING_POLL_MS : false,
  });
}
