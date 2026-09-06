import { apiGet, apiPost } from '@/api/request';
import type { RequestOptions } from '@/types/api';
import type {
  QuoteResponse,
  SeatMapResponse,
  TripDetailResponse,
} from '@/types/api-responses';
import type { Id, Quote, Trip, TripSeat } from '@/types/models';

import { toQuote, toSeatMap, toTrip } from './mappers';

/**
 * Trip read model — `API Rakeb.md` §5.
 *
 * Shared by both sides: a passenger opens a trip from search results, a driver
 * opens their own from `/me/trips`. Driver *mutations* (publish, edit, start,
 * complete) belong to `features/carpool/publishing`.
 *
 * Responses are mapped from the wire shape to the app model in `./mappers`.
 */

/** `GET /trips/{id}` — itinerary, stops, vehicle, driver, cancellation policy. */
export async function getTrip(tripId: string, options?: RequestOptions): Promise<Trip> {
  return toTrip(await apiGet<TripDetailResponse>(`/trips/${tripId}`, undefined, options));
}

/** `GET /trips/{id}/seat-map` — one entry per physical seat. */
export async function getSeatMap(
  tripId: string,
  options?: RequestOptions,
): Promise<TripSeat[]> {
  return toSeatMap(
    await apiGet<SeatMapResponse>(`/trips/${tripId}/seat-map`, undefined, options),
  );
}

export type QuoteInput = {
  seats: number;
  seat_ids?: SeatPositionInput[];
  pickup_stop_id?: Id | null;
  dropoff_stop_id?: Id | null;
  promo_code?: string | null;
};

type SeatPositionInput = TripSeat['seat'];

/**
 * `POST /trips/{id}/quote` — the fare before a booking is created.
 *
 * A read dressed as a POST because the body carries the seat selection and
 * promo code. The response `total` is authoritative; the client never sums the
 * parts.
 */
export async function getQuote(
  tripId: string,
  input: QuoteInput,
  options?: RequestOptions,
): Promise<Quote> {
  return toQuote(await apiPost<QuoteResponse>(`/trips/${tripId}/quote`, input, options));
}
