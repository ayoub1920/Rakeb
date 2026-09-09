import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getNextCursor, INITIAL_CURSOR } from '@/api/pagination';
import { STALE_TIME } from '@/api/query-client';
import { QUERY_SCOPES } from '@/api/query-keys';
import { useIsAuthenticated } from '@/auth/use-auth';
import type { ApiError, CursorPage } from '@/types/api';
import type { Booking, BookingBucket, BookingDetail } from '@/types/models';

import {
  cancelBooking,
  createBooking,
  getBooking,
  getBookings,
  shareBooking,
  type CancelBookingResult,
  type CreateBookingInput,
  type ShareBookingResult,
} from './api';
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

/**
 * `GET /bookings/{id}`.
 *
 * `refetchOnMount` for the same reason as the list — the driver may have
 * accepted a `pending` request while the rider was elsewhere.
 */
export function useBooking(bookingId: string | undefined) {
  return useQuery<BookingDetail, ApiError>({
    queryKey: bookingKeys.detail(bookingId ?? ''),
    queryFn: ({ signal }) => getBooking(bookingId as string, { signal }),
    enabled: Boolean(bookingId),
    staleTime: STALE_TIME.volatile,
    refetchOnMount: 'always',
  });
}

/**
 * `POST /bookings`.
 *
 * Seeds the detail cache with the response so the ticket screen it navigates to
 * paints immediately, then invalidates the lists and the trip (its seat count
 * just dropped).
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation<BookingDetail, ApiError, CreateBookingInput>({
    mutationFn: (input) => createBooking(input),
    onSuccess: (booking) => {
      queryClient.setQueryData(bookingKeys.detail(booking.id), booking);
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.trips] });
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.tripSearch] });
    },
  });
}

/** `POST /bookings/{id}/cancel`. Invalidates the detail and every bookings list. */
export function useCancelBooking(bookingId: string) {
  const queryClient = useQueryClient();

  return useMutation<CancelBookingResult, ApiError, void>({
    mutationFn: () => cancelBooking(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.trips] });
      // A freed seat reappears in search; a refund lands in the wallet.
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.tripSearch] });
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.wallet] });
    },
  });
}

/** `POST /bookings/{id}/share` — no cache impact, just returns a link. */
export function useShareBooking(bookingId: string) {
  return useMutation<ShareBookingResult, ApiError, void>({
    mutationFn: () => shareBooking(bookingId),
  });
}
