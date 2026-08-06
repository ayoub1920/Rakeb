import { useQuery } from '@tanstack/react-query';

import { STALE_TIME } from '@/api/query-client';
import type { ApiError } from '@/types/api';
import type { Trip } from '@/types/models';

import { getTrip } from './api';
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
