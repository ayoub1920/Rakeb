import { useInfiniteQuery } from '@tanstack/react-query';

import { getNextCursor, INITIAL_CURSOR } from '@/api/pagination';
import { STALE_TIME } from '@/api/query-client';
import { useIsAuthenticated } from '@/auth/use-auth';
import type { ApiError, CursorPage } from '@/types/api';
import type { Booking, BookingBucket } from '@/types/models';

import { getBookings } from './api';
import { bookingKeys } from './keys';

/**
 * `GET /bookings?status=`.
 *
 * `refetchOnMount` is on: a booking's status changes because of someone else
 * (the driver accepts or declines), so returning to Activité must re-read it
 * rather than trust the cache.
 */
export function useBookings(bucket: BookingBucket) {
  const isAuthenticated = useIsAuthenticated();

  return useInfiniteQuery<CursorPage<Booking>, ApiError>({
    queryKey: bookingKeys.list(bucket),
    queryFn: ({ pageParam, signal }) => getBookings(bucket, pageParam as string | null, { signal }),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: getNextCursor,
    enabled: isAuthenticated,
    staleTime: STALE_TIME.volatile,
    refetchOnMount: 'always',
  });
}
