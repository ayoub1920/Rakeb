/**
 * TEMPORARY domain types.
 *
 * These are hand-written from `API Rakeb.md` and cover only what the scaffold's
 * example endpoints touch. They are deliberately incomplete.
 *
 * They must be replaced by types generated from the NestJS OpenAPI document
 * (`openapi-typescript` or `@hey-api/openapi-ts` against `/v1/openapi.json`).
 * When that happens this file is deleted, not extended — see
 * "Replacing these types" in `docs/API_MAPPING.md`.
 *
 * Field naming stays `snake_case` end-to-end so generated types drop in without
 * a mapping layer.
 */

export type Id = string;

/** ISO 8601 timestamp, e.g. `2026-08-06T14:30:00.000Z`. */
export type IsoDateTime = string;

/** Calendar date, `yyyy-MM-dd`. Used by `/trips/search?date=`. */
export type IsoDate = string;

/** Integer amount in millimes. `15800` = 15,800 DT. Never a float. */
export type Millimes = number;

export type Coordinates = {
  lat: number;
  lng: number;
};

// ---------------------------------------------------------------------------
// Service catalogue — GET /services, GET /config
// ---------------------------------------------------------------------------

export type ServiceStatus = 'live' | 'coming_soon';

export type ServiceId = 'carpool' | 'taxi' | 'food' | 'grocery';

export type ServiceDefinition = {
  id: ServiceId;
  status: ServiceStatus;
  /** Display name, already localized by the backend when it serves the list. */
  name: string;
  description: string;
};

export type AppConfig = {
  /** Loosely typed until the real shape is documented. */
  feature_flags: Record<string, boolean>;
  currency: string;
  min_price_per_seat: Millimes;
  max_price_per_seat: Millimes;
  min_app_version: string;
};

// ---------------------------------------------------------------------------
// Users — GET /me, GET /users/{id}
// ---------------------------------------------------------------------------

export type UserRole = 'rider' | 'driver' | 'both';

export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type User = {
  id: Id;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  rating: number | null;
  trips_count: number;
  member_since: IsoDateTime;
};

// ---------------------------------------------------------------------------
// Auth — POST /auth/phone/start, POST /auth/phone/verify
// ---------------------------------------------------------------------------

export type PhoneAuthChallenge = {
  otp_token: string;
  /** Seconds until the OTP expires. */
  expires_in: number;
  /** Seconds before a resend is allowed. */
  resend_after: number;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  is_new_user: boolean;
};

// ---------------------------------------------------------------------------
// Places — GET /places/autocomplete, GET /places/{id}
// ---------------------------------------------------------------------------

export type Place = {
  id: Id;
  label: string;
  governorate: string;
} & Coordinates;

// ---------------------------------------------------------------------------
// Trips — GET /trips/search, GET /trips/{id}
// ---------------------------------------------------------------------------

export type TripStatus = 'draft' | 'published' | 'full' | 'in_progress' | 'completed' | 'cancelled';

export type TripDriver = {
  id: Id;
  first_name: string;
  avatar_url: string | null;
  rating: number | null;
};

export type TripVehicle = {
  id: Id;
  model: string;
  color: string;
};

/** Search result row. The full trip detail returns more (stops, policies, seat map). */
export type TripSummary = {
  id: Id;
  status: TripStatus;
  origin: Place;
  destination: Place;
  departure_at: IsoDateTime;
  price_per_seat: Millimes;
  seats_available: number;
  instant_book: boolean;
  driver: TripDriver;
};

export type Trip = TripSummary & {
  stops: Place[];
  vehicle: TripVehicle;
  max_two_in_back: boolean;
  cancellation_policy: string;
};

export type TripSortOption = 'departure' | 'price' | 'rating';

// ---------------------------------------------------------------------------
// Bookings — GET /bookings, GET /bookings/{id}
// ---------------------------------------------------------------------------

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'declined'
  | 'cancelled_by_rider'
  | 'cancelled_by_driver'
  | 'expired';

/** `GET /bookings?status=` accepts these buckets, not the raw status. */
export type BookingBucket = 'upcoming' | 'past' | 'cancelled';

export type Booking = {
  id: Id;
  status: BookingStatus;
  trip: TripSummary;
  seats: number;
  total_price: Millimes;
  reservation_code: string;
  created_at: IsoDateTime;
};
