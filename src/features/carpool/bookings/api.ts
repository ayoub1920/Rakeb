import { toCursorParams } from '@/api/pagination';
import { apiGet, apiPost } from '@/api/request';
import { createRequestId } from '@/api/request-id';
import type { CursorPage, RequestOptions } from '@/types/api';
import type {
  BookingResponse,
  BookingTicketResponse,
  CancelBookingResponse,
  PaginatedResponse,
  ShareBookingResponse,
} from '@/types/api-responses';
import type {
  Booking,
  BookingBucket,
  BookingDetail,
  Id,
  SeatPosition,
  TripSeat,
} from '@/types/models';

import { toTripSummary } from '../trips/mappers';

/**
 * Passenger bookings — `API Rakeb.md` §6.
 *
 * Not implemented (add here):
 *   GET /bookings/{id}/ticket.ics  (available as `ics_url` on the ticket)
 *
 * The driver's side of a booking (`/me/booking-requests`, accept, decline)
 * belongs to `features/carpool/publishing`.
 */

const SEAT_LABELS: Record<SeatPosition, string> = {
  front: 'Avant',
  rear_left: 'Arrière gauche',
  rear_middle: 'Arrière centre',
  rear_right: 'Arrière droite',
};

/**
 * Only used for the list endpoint, which does not embed the policy. The detail
 * / ticket endpoint returns the real, configuration-resolved
 * `cancellation_policy` string and that is preferred whenever present.
 */
const FALLBACK_POLICY =
  'Annulation gratuite jusqu’à 24 h avant le départ. Passé ce délai, 50 % sont retenus pour le conducteur.';

function toBooking(dto: BookingResponse): Booking {
  return {
    id: dto.id,
    status: dto.status as Booking['status'],
    // A booking always carries its trip in these responses; the fallback keeps
    // the type honest for the rare null.
    trip: dto.trip
      ? toTripSummary(dto.trip)
      : {
          id: dto.trip_id,
          status: 'published',
          origin: { id: '', label: '—', governorate: '', lat: 0, lng: 0 },
          destination: { id: '', label: '—', governorate: '', lat: 0, lng: 0 },
          departure_at: dto.created_at,
          price_per_seat: dto.price.base,
          seats_available: 0,
          instant_book: false,
          driver: { id: '', first_name: '—', avatar_url: null, rating: null, reviews_count: 0, verified: false },
        },
    seats: dto.seats,
    total_price: dto.price.total,
    reservation_code: dto.reservation_code,
    created_at: dto.created_at,
  };
}

function toBookingDetail(dto: BookingResponse | BookingTicketResponse): BookingDetail {
  const ticket = dto as Partial<BookingTicketResponse>;
  return {
    ...toBooking(dto),
    passenger_code: ticket.passenger_code ?? '',
    barcode_url: ticket.barcode_url ?? null,
    seat_labels: (dto.seat_codes ?? []).map((code) => SEAT_LABELS[code as SeatPosition] ?? code),
    pickup_label: dto.trip?.origin_label ?? '—',
    dropoff_label: dto.trip?.destination_label ?? '—',
    // Not carried by the API on this resource; the ticket shows the amount only.
    payment_method_label: '',
    cancellation_policy: ticket.cancellation_policy ?? FALLBACK_POLICY,
    expires_at: dto.expires_at ?? null,
    conversation_id: dto.conversation_id ?? null,
  };
}

/** `GET /bookings?status=` — the Activité screen. */
export async function getBookings(
  bucket: BookingBucket,
  cursor?: string | null,
  options?: RequestOptions,
): Promise<CursorPage<Booking>> {
  const page = await apiGet<PaginatedResponse<BookingResponse>>(
    '/bookings',
    { status: bucket, ...toCursorParams(cursor) },
    options,
  );
  return {
    items: page.items.map(toBooking),
    next_cursor: page.next_cursor,
    total: page.total,
  };
}

/** `GET /bookings/{id}` — detail plus the ticket fields. */
export async function getBooking(
  bookingId: string,
  options?: RequestOptions,
): Promise<BookingDetail> {
  return toBookingDetail(
    await apiGet<BookingTicketResponse>(`/bookings/${bookingId}`, undefined, options),
  );
}

export type CreateBookingInput = {
  trip_id: Id;
  seats: number;
  seat_ids?: TripSeat['seat'][];
  pickup_stop_id?: Id | null;
  dropoff_stop_id?: Id | null;
  payment_method_id: Id;
  promo_code?: string | null;
  message?: string | null;
};

/**
 * `POST /bookings` — creates the request.
 *
 * A fresh `Idempotency-Key` per attempt: a retry of the same tap must not
 * create a second booking, but a deliberate new booking must. A 409 here
 * ("plus de place" or an existing active booking) is an expected outcome, not a
 * transport error — see `isRetryableError`.
 */
export async function createBooking(
  input: CreateBookingInput,
  options?: RequestOptions,
): Promise<BookingDetail> {
  const { pickup_stop_id, dropoff_stop_id, ...rest } = input;
  const body = {
    ...rest,
    stops:
      pickup_stop_id || dropoff_stop_id
        ? { pickup_stop_id: pickup_stop_id ?? null, dropoff_stop_id: dropoff_stop_id ?? null }
        : undefined,
  };
  const dto = await apiPost<BookingResponse>('/bookings', body, {
    ...options,
    headers: { 'Idempotency-Key': createRequestId() },
  });
  return toBookingDetail(dto);
}

export type CancelBookingResult = {
  status: BookingDetail['status'];
  /** Amount returned to the rider, in millimes. */
  refund: number;
  message: string;
};

/** `POST /bookings/{id}/cancel` — the backend computes the refund. */
export async function cancelBooking(
  bookingId: string,
  options?: RequestOptions,
): Promise<CancelBookingResult> {
  const dto = await apiPost<CancelBookingResponse>(
    `/bookings/${bookingId}/cancel`,
    undefined,
    options,
  );
  return {
    status: dto.status as BookingDetail['status'],
    refund: dto.refund_amount,
    message: dto.policy,
  };
}

export type ShareBookingResult = { share_url: string; expires_at: string };

/** `POST /bookings/{id}/share` — a tracking link to send to a relative. */
export function shareBooking(
  bookingId: string,
  options?: RequestOptions,
): Promise<ShareBookingResult> {
  return apiPost<ShareBookingResponse>(`/bookings/${bookingId}/share`, undefined, options);
}
