import type {
  QuoteResponse,
  SeatMapResponse,
  TripDetailResponse,
  TripSummaryResponse,
} from '@/types/api-responses';
import type { Coordinates, Place, Quote, Trip, TripSeat, TripSummary } from '@/types/models';

/**
 * Wire → domain mappers for trips.
 *
 * The API flattens a place into `origin_label` / `origin_lat` / `origin_lng`
 * and has no id or governorate for it; the app model keeps a nested `Place`, so
 * the synthetic place carries an empty id and governorate. Nothing downstream
 * needs a real place id for a trip endpoint — the trip id is what routing uses.
 *
 * Shared by `carpool/search` and `carpool/bookings` because a search result and
 * a booking both embed a trip summary.
 */

function place(label: string, lat: number, lng: number): Place {
  return { id: '', label, governorate: '', lat, lng };
}

/** GeoJSON `LineString` (`[lng, lat]`) → ordered `{ lat, lng }`, or `null`. */
function toRoute(raw: TripDetailResponse['route']): Coordinates[] | null {
  if (!raw?.coordinates || raw.coordinates.length < 2) return null;
  return raw.coordinates.map(([lng, lat]) => ({ lat, lng }));
}

export function toTripSummary(dto: TripSummaryResponse): TripSummary {
  return {
    id: dto.id,
    status: dto.status as TripSummary['status'],
    origin: place(dto.origin_label, dto.origin_lat, dto.origin_lng),
    destination: place(dto.destination_label, dto.destination_lat, dto.destination_lng),
    departure_at: dto.departure_at,
    price_per_seat: dto.price_per_seat,
    seats_available: dto.seats_available,
    instant_book: dto.instant_book,
    driver: {
      id: dto.driver.id,
      first_name: dto.driver.display_name,
      avatar_url: dto.driver.avatar_url,
      rating: dto.driver.rating > 0 ? dto.driver.rating : null,
      reviews_count: dto.driver.reviews_count ?? 0,
      verified: dto.driver.verified ?? false,
    },
  };
}

export function toTrip(dto: TripDetailResponse): Trip {
  return {
    ...toTripSummary(dto),
    stops: dto.stops
      .filter((stop) => stop.kind !== 'origin' && stop.kind !== 'destination')
      .sort((a, b) => a.sequence - b.sequence)
      .map((stop) => place(stop.label, stop.lat, stop.lng)),
    vehicle: {
      id: dto.vehicle.id,
      model: [dto.vehicle.make, dto.vehicle.model].filter(Boolean).join(' '),
      color: dto.vehicle.color,
    },
    max_two_in_back: dto.max_two_in_back,
    cancellation_policy: dto.cancellation_policy.summary,
    route: toRoute(dto.route),
  };
}

export function toSeatMap(dto: SeatMapResponse): TripSeat[] {
  return dto.seats.map((entry) => ({
    seat: entry.seat as TripSeat['seat'],
    state: entry.state as TripSeat['state'],
  }));
}

export function toQuote(dto: QuoteResponse): Quote {
  return {
    base: dto.base,
    service_fee: dto.service_fee,
    discount: dto.discount,
    total: dto.total,
    promo_code: dto.promo_code && dto.promo_code.length > 0 ? dto.promo_code : null,
  };
}
