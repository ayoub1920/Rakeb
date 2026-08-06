import { toCursorParams } from '@/api/pagination';
import { apiGet } from '@/api/request';
import type { CursorPage, RequestOptions } from '@/types/api';
import type { Booking, BookingBucket } from '@/types/models';

/**
 * Passenger bookings — `API Rakeb.md` §6.
 *
 * Not implemented (add here):
 *   POST /bookings · GET /bookings/{id} · GET /bookings/{id}/ticket.ics
 *   POST /bookings/{id}/cancel · POST /bookings/{id}/share
 *
 * The driver's side of a booking (`/me/booking-requests`, accept, decline)
 * belongs to `features/carpool/publishing`.
 */

/**
 * `GET /bookings?status=` — the Activité screen.
 *
 * The filter takes a bucket (`upcoming | past | cancelled`), not a raw
 * `BookingStatus`; the mapping from statuses to buckets is the backend's.
 */
export function getBookings(
  bucket: BookingBucket,
  cursor?: string | null,
  options?: RequestOptions,
): Promise<CursorPage<Booking>> {
  return apiGet<CursorPage<Booking>>(
    '/bookings',
    { status: bucket, ...toCursorParams(cursor) },
    options,
  );
}
