import { toCursorParams } from '@/api/pagination';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/api/request';
import type { CursorPage, RequestOptions } from '@/types/api';
import type {
  BookingResponse,
  PaginatedResponse,
  PriceSuggestionResponse,
  TripCompleteResponse,
  TripDetailResponse,
  TripStartResponse,
  TripSummaryResponse,
} from '@/types/api-responses';
import type {
  Booking,
  BookingRequest,
  DriverTripBucket,
  Id,
  IsoDate,
  Millimes,
  Place,
  PriceSuggestion,
  Trip,
  TripSummary,
} from '@/types/models';

import { toTrip, toTripSummary } from '../trips/mappers';

/**
 * Everything the driver does — `API Rakeb.md` §7.
 *
 * `POST /trips` takes the whole trip in one payload, so the wizard edits a
 * single draft (`stores/publish-draft-store`) and this module turns it into a
 * `CreateTripDto` at submit time.
 */

// --- Price suggestion -------------------------------------------------

export async function getPriceSuggestion(
  params: { from_place_id: Id; to_place_id: Id; date?: IsoDate },
  options?: RequestOptions,
): Promise<PriceSuggestion> {
  const dto = await apiGet<PriceSuggestionResponse>(
    '/trips/price-suggestion',
    { from: params.from_place_id, to: params.to_place_id, date: params.date },
    options,
  );
  return { suggested: dto.suggested, min: dto.min, max: dto.max };
}

// --- Publish -----------------------------------------------------

export type PublishDraft = {
  vehicleId: Id;
  origin: Place;
  destination: Place;
  stops: Place[];
  /** `yyyy-MM-dd`. */
  departureDate: IsoDate;
  /** `HH:mm`, local time. */
  departureTime: string;
  seats: number;
  pricePerSeat: Millimes;
  instantBook: boolean;
  maxTwoInBack: boolean;
  notes: string;
  recurrence: { days: number[]; until: IsoDate } | null;
};

function point(place: Place) {
  return {
    place_id: place.id || undefined,
    lat: place.lat,
    lng: place.lng,
    label: place.label,
  };
}

/** Local `yyyy-MM-dd` + `HH:mm` → UTC ISO 8601. */
function toDepartureIso(date: IsoDate, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

/** `POST /trips` — publishes immediately (`publish: true`). */
export async function publishTrip(draft: PublishDraft, options?: RequestOptions): Promise<Trip> {
  const body = {
    vehicle_id: draft.vehicleId,
    origin: point(draft.origin),
    destination: point(draft.destination),
    stops: draft.stops.map((stop) => point(stop)),
    departure_at: toDepartureIso(draft.departureDate, draft.departureTime),
    seats: draft.seats,
    price_per_seat: draft.pricePerSeat,
    instant_book: draft.instantBook,
    max_two_in_back: draft.maxTwoInBack,
    notes: draft.notes.trim() || undefined,
    recurrence: draft.recurrence
      ? { freq: 'weekly', days: draft.recurrence.days, until: draft.recurrence.until }
      : undefined,
    publish: true,
  };
  return toTrip(await apiPost<TripDetailResponse>('/trips', body, options));
}

// --- Manage published trips ----------------------------------------

/** `GET /me/trips?status=` — a bare array. */
export async function getMyTrips(
  status: DriverTripBucket,
  options?: RequestOptions,
): Promise<TripSummary[]> {
  const rows = await apiGet<TripSummaryResponse[]>('/me/trips', { status }, options);
  return rows.map(toTripSummary);
}

export type UpdateTripInput = {
  departure_at?: string;
  seats?: number;
  price_per_seat?: Millimes;
  instant_book?: boolean;
  notes?: string;
};

/** `PATCH /trips/{id}` — price is frozen once a booking exists; the server enforces it. */
export async function updateTrip(
  tripId: string,
  input: UpdateTripInput,
  options?: RequestOptions,
): Promise<Trip> {
  return toTrip(await apiPatch<TripDetailResponse>(`/trips/${tripId}`, input, options));
}

/** `DELETE /trips/{id}` with a reason — cancels the trip and refunds riders. */
export function cancelTrip(
  tripId: string,
  reason: string,
  options?: RequestOptions,
): Promise<void> {
  return apiDelete<void>(`/trips/${tripId}`, options, { reason });
}

/** `POST /trips/{id}/publish` — promotes a `draft` and schedules its reminders. */
export async function publishTripDraft(tripId: string, options?: RequestOptions): Promise<Trip> {
  return toTrip(await apiPost<TripDetailResponse>(`/trips/${tripId}/publish`, undefined, options));
}

// --- Booking requests --------------------------------------------

function toBookingRequest(dto: BookingResponse): BookingRequest {
  const base: Booking = {
    id: dto.id,
    status: dto.status as Booking['status'],
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
  return {
    ...base,
    rider: {
      id: dto.rider?.id ?? '',
      display_name: dto.rider?.display_name ?? 'Passager',
      avatar_url: dto.rider?.avatar_url ?? null,
      rating: dto.rider && dto.rider.rating > 0 ? dto.rider.rating : null,
      phone: dto.rider?.phone ?? null,
    },
    note: dto.message,
    expires_at: dto.expires_at,
  };
}

/** `GET /me/booking-requests?trip_id=&status=`. */
export async function getBookingRequests(
  params: { trip_id?: Id | null; status?: string },
  cursor?: string | null,
  options?: RequestOptions,
): Promise<CursorPage<BookingRequest>> {
  const page = await apiGet<PaginatedResponse<BookingResponse>>(
    '/me/booking-requests',
    {
      trip_id: params.trip_id ?? undefined,
      status: params.status,
      ...toCursorParams(cursor),
    },
    options,
  );
  return {
    items: page.items.map(toBookingRequest),
    next_cursor: page.next_cursor,
    total: page.total,
  };
}

/** `POST /bookings/{id}/accept` — captures the rider's payment. */
export function acceptBooking(bookingId: string, options?: RequestOptions): Promise<void> {
  return apiPost<void>(`/bookings/${bookingId}/accept`, undefined, options);
}

/** `POST /bookings/{id}/decline` — releases the authorisation. */
export function declineBooking(
  bookingId: string,
  reason: string,
  options?: RequestOptions,
): Promise<void> {
  return apiPost<void>(`/bookings/${bookingId}/decline`, { reason }, options);
}

/**
 * `POST /bookings/{id}/no-show` — the driver marks a confirmed passenger as
 * absent once the carpool has started. The fare is not refunded.
 */
export function markNoShow(bookingId: string, options?: RequestOptions): Promise<void> {
  return apiPost<void>(`/bookings/${bookingId}/no-show`, undefined, options);
}

// --- Trip lifecycle ---------------------------------------------

export type StartTripResult = {
  status: string;
  started_at: string;
  checked_in: number;
  total: number;
  checked_in_booking_id?: string;
};

/**
 * `POST /trips/{id}/start`.
 *
 * Called with no code it starts the carpool ("Démarrer le covoiturage") and
 * moves the trip to `in_progress`. Called again with a passenger's 4-digit
 * `passenger_code` it checks that passenger in.
 */
export async function startTrip(
  tripId: string,
  passengerCode?: string,
  options?: RequestOptions,
): Promise<StartTripResult> {
  const body = passengerCode ? { passenger_code: passengerCode } : {};
  const dto = await apiPost<TripStartResponse>(`/trips/${tripId}/start`, body, options);
  return {
    status: dto.status,
    started_at: dto.started_at,
    checked_in: dto.checked_in_passengers,
    total: dto.total_passengers,
    checked_in_booking_id: dto.checked_in_booking_id ?? undefined,
  };
}

export type CompleteTripResult = { status: string; driver_credit: Millimes };

/** `POST /trips/{id}/complete` — pays the driver and opens the review prompts. */
export async function completeTrip(
  tripId: string,
  options?: RequestOptions,
): Promise<CompleteTripResult> {
  const dto = await apiPost<TripCompleteResponse>(`/trips/${tripId}/complete`, undefined, options);
  return { status: dto.status, driver_credit: dto.driver_credit };
}
