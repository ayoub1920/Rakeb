/**
 * Backend response DTOs — the shapes the NestJS API actually returns.
 *
 * These are hand-written from the OpenAPI document (`GET /docs-json`) and cover
 * only what the passenger booking flow consumes. They are the *wire* types; the
 * app's domain types live in `./models.ts`, and each feature's `api.ts` maps
 * one to the other at the boundary.
 *
 * The two diverge on purpose — the wire flattens places into
 * `origin_label`/`origin_lat`, names the driver `display_name`, wraps the seat
 * map, and returns bare arrays where the app expects a page. When the frontend
 * moves to generated types (`docs/API_MAPPING.md`), this file and the mappers
 * are what get deleted.
 */

import type { Millimes } from './models';

export type PaginatedResponse<T> = {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
  total: number;
};

// --- Places ---------------------------------------------------------------

export type PlaceResponse = {
  id: string;
  name: string;
  address: string | null;
  governorate: string | null;
  kind: string;
  lat: number;
  lng: number;
  distance_m?: number;
};

export type PlaceListResponse = { items: PlaceResponse[] };

export type ReverseGeocodeResponse = {
  lat: number;
  lng: number;
  label: string;
  governorate: string | null;
};

// --- Trips --------------------------------------------------------------

export type TripDriverResponse = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  rating: number;
  reviews_count: number;
  verified: boolean;
};

export type TripSummaryResponse = {
  id: string;
  status: string;
  origin_label: string;
  destination_label: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  departure_at: string;
  arrival_estimate_at: string | null;
  distance_m: number;
  duration_s: number;
  price_per_seat: Millimes;
  currency: string;
  seats_available: number;
  seats_total: number;
  instant_book: boolean;
  direct: boolean;
  driver: TripDriverResponse;
};

export type TripStopResponse = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  sequence: number;
  kind: string;
  price_from_origin: Millimes;
  eta: string | null;
};

/** GeoJSON `LineString`, coordinates as `[longitude, latitude]` pairs. */
export type GeoLineString = { type: 'LineString'; coordinates: [number, number][] };

export type TripDetailResponse = TripSummaryResponse & {
  vehicle: { id: string; make: string; model: string; color: string; photo_url: string | null };
  stops: TripStopResponse[];
  cancellation_policy: { free_before_hours: number; late_refund_percent: number; summary: string };
  max_two_in_back: boolean;
  notes: string | null;
  /** Planned itinerary geometry (real roads under Google routing), or `null`. */
  route: GeoLineString | null;
  created_at: string;
};

export type SeatMapResponse = {
  seats: { seat: string; state: string }[];
  seats_available: number;
};

export type TripMapMarkerResponse = {
  trip_id: string;
  lat: number;
  lng: number;
  kind: string;
  price_per_seat: Millimes;
  departure_at: string;
};

export type TripMapResponse = {
  markers: TripMapMarkerResponse[];
  /** One GeoJSON `LineString` per trip, keyed by trip id. `[lng, lat]` pairs. */
  polylines: Record<string, { type: string; coordinates: [number, number][] }>;
  total: number;
};

export type QuoteResponse = {
  base: Millimes;
  service_fee: Millimes;
  discount: Millimes;
  total: Millimes;
  currency: string;
  promo_code?: string;
  seats: number;
};

// --- Bookings ---------------------------------------------------------

export type BookingPriceResponse = {
  base: Millimes;
  service_fee: Millimes;
  discount: Millimes;
  total: Millimes;
  refunded: Millimes;
  currency: string;
};

export type BookingRiderResponse = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  rating: number;
  phone: string | null;
};

export type BookingResponse = {
  id: string;
  status: string;
  trip_id: string;
  seats: number;
  seat_codes: string[];
  reservation_code: string;
  price: BookingPriceResponse;
  message: string | null;
  pickup_stop_id: string | null;
  dropoff_stop_id: string | null;
  conversation_id: string | null;
  expires_at: string | null;
  created_at: string;
  trip: TripSummaryResponse | null;
  rider: BookingRiderResponse | null;
};

export type BookingTicketResponse = BookingResponse & {
  passenger_code: string;
  barcode_url: string;
  ics_url: string;
  cancellation_policy: string;
};

export type CancelBookingResponse = {
  id: string;
  status: string;
  refund_amount: Millimes;
  refund_percent: number;
  policy: string;
  currency: string;
};

export type ShareBookingResponse = { share_url: string; expires_at: string };

// --- Payments & promos ------------------------------------------------

export type PaymentMethodResponse = {
  id: string;
  type: string;
  provider: string | null;
  brand: string | null;
  last4: string | null;
  msisdn: string | null;
  label: string | null;
  is_default: boolean;
  created_at: string;
};

// --- Profile & preferences -----------------------------------------------

export type PreferencesResponse = {
  chat: string;
  music: string;
  smoking: string;
  pets: string;
};

export type AvatarResponse = {
  avatar_url: string | null;
  upload_id?: string;
};

// --- Wallet ---------------------------------------------------------------

export type WalletBalanceResponse = {
  available: Millimes;
  pending: Millimes;
  total: Millimes;
  currency: string;
};

export type WalletTransactionResponse = {
  id: string;
  type: string;
  status: string;
  amount: Millimes;
  currency: string;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  available_at: string | null;
  created_at: string;
};

export type TopupResponse = {
  payment_id: string;
  status: string;
  amount: Millimes;
  available_balance: Millimes;
  currency: string;
};

export type WithdrawResponse = {
  transaction_id: string;
  amount: Millimes;
  status: string;
  available_balance: Millimes;
  currency: string;
};

export type ValidatePromoResponse = {
  valid: boolean;
  code: string;
  label: string;
  discount: Millimes;
  base: Millimes;
  total: Millimes;
  currency: string;
};

export type PromoBannerResponse = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  action_url: string | null;
  promo_code: string | null;
};

// --- Tracking -------------------------------------------------------

export type TrackingResponse = {
  trip_id: string;
  trip_status: string;
  position: {
    lat: number;
    lng: number;
    heading: number | null;
    speed: number | null;
    recorded_at: string;
  } | null;
  eta_at: string | null;
  remaining_distance_m: number | null;
  traffic: string;
  live: boolean;
};

// --- Conversations & reviews ----------------------------------------

export type ConversationParticipantResponse = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
};

export type MessageResponse = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  type: string;
  body: string;
  created_at: string;
};

export type ConversationResponse = {
  id: string;
  booking_id: string;
  trip_id: string;
  trip_label: string;
  departure_at: string;
  counterpart: ConversationParticipantResponse | null;
  last_message: MessageResponse | null;
  unread_count: number;
  status: string;
  last_message_at: string | null;
};

export type QuickReplyResponse = { code: string; label: string; audience: string };

// --- Driver: vehicles, publishing, verifications ------------------------

export type VehicleResponse = {
  id: string;
  make: string;
  model: string;
  color: string;
  plate: string;
  year: number | null;
  seats: number;
  photo_url: string | null;
  is_default: boolean;
  created_at: string;
};

export type PriceSuggestionResponse = {
  suggested: Millimes;
  min: Millimes;
  max: Millimes;
  distance_m: number;
  currency: string;
};

export type VerificationsResponse = {
  phone: string;
  email: string;
  cin: string;
  licence: string;
  cin_rejection_reason: string | null;
  licence_rejection_reason: string | null;
  can_publish_trips: boolean;
};

// --- Uploads — POST /uploads/sign, POST /uploads/{id}/confirm -----------

export type SignedUploadResponse = {
  upload_id: string;
  /** Pre-signed `PUT` URL — call directly, never through `apiClient`. */
  url: string;
  method: string;
  headers: Record<string, string>;
  object_key: string;
  expires_at: string;
  confirm_url?: string;
};

export type UploadResponse = {
  id: string;
  purpose: string;
  mime_type: string;
  size_bytes: number;
  status: string;
  url: string | null;
  created_at: string;
};

// --- Admin: verification review — GET/POST /admin/verifications/* -------
//
// Not in `API Rakeb.md` — covers both `cin` and `licence` submissions; the
// frontend only surfaces `licence` today (`features/admin/licences`).

export type AdminVerificationResponse = {
  id: string;
  user_id: string;
  display_name: string;
  phone: string;
  type: string;
  status: string;
  document_last4: string | null;
  submitted_at: string | null;
  front_upload_id: string | null;
  back_upload_id: string | null;
  /** Short-lived signed URL; re-fetch the record once it expires. */
  front_upload_url: string | null;
  back_upload_url: string | null;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null;
  rejection_reason: string | null;
  created_at: string;
};

// --- Admin: user directory — GET/PATCH /admin/users/* --------------------
//
// Not in `API Rakeb.md` — `rakeb-backend`'s `src/modules/admin/admin-users.controller.ts`.

export type AdminUserSummaryResponse = {
  id: string;
  phone: string;
  email: string | null;
  display_name: string;
  role: string;
  status: string;
  rating: number;
  created_at: string;
};

export type AdminUserDetailResponse = AdminUserSummaryResponse & {
  first_name: string | null;
  last_name: string | null;
  phone_verified: boolean;
  email_verified: boolean;
  reviews_count: number;
  trips_as_driver: number;
  trips_as_rider: number;
  referral_code: string;
  verifications: { cin: string; licence: string };
  last_seen_at: string | null;
};

export type TripStartResponse = {
  trip_id: string;
  status: string;
  started_at: string;
  checked_in_passengers: number;
  total_passengers: number;
  checked_in_booking_id: string | null;
};

export type TripCompleteResponse = {
  trip_id: string;
  status: string;
  completed_at: string;
  completed_bookings: number;
  driver_credit: Millimes;
};

export type ReviewTagResponse = { code: string; label: string; direction: string };

export type PendingReviewResponse = {
  booking_id: string;
  trip_id: string;
  trip_label: string;
  departure_at: string;
  target_user_id: string;
  target_display_name: string;
  target_avatar_url: string | null;
  direction: string;
};

// --- Notifications ------------------------------------------------------

export type NotificationResponse = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, string>;
  read_at: string | null;
  created_at: string;
};

export type UnreadCountResponse = { unread_count: number };

export type MarkAllReadResponse = { updated: number };
