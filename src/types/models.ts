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

export type UserRole = 'rider' | 'driver' | 'both' | 'admin' | 'support';

/** A suspended or deleted account is rejected at login (`rakeb-backend`'s `AuthService`); neither erases data. */
export type UserStatus = 'active' | 'suspended' | 'deleted';

export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type User = {
  id: Id;
  first_name: string | null;
  last_name: string | null;
  /** Never-empty label for the UI greeting. Full name → first name → email → phone. */
  display_name: string;
  phone: string;
  email: string | null;
  /** `yyyy-MM-dd`; `null` until the user fills it in on the edit screen. */
  birth_date?: IsoDate | null;
  bio?: string | null;
  avatar_url: string | null;
  role: UserRole;
  phone_verified?: boolean;
  email_verified?: boolean;
  /** Absent until the user has been rated. */
  rating?: number | null;
  /** Absent until the profile-stats endpoint is wired server-side. */
  trips_count?: number | null;
  reviews_count?: number | null;
  referral_code?: string;
  marketing_opt_in?: boolean;
  locale?: string;
  member_since?: IsoDateTime | null;
};

/** `GET /users/{id}` — another member's public profile. */
export type PublicProfile = {
  id: Id;
  display_name: string;
  avatar_url: string | null;
  rating: number | null;
  reviews_count: number;
  trips_as_driver: number;
  trips_as_rider: number;
  member_since: IsoDateTime;
  badges: string[];
  bio: string | null;
};

/** One review row on a public profile. */
export type UserReview = {
  id: Id;
  rating: number;
  tags: string[];
  comment: string | null;
  author_name: string;
  author_avatar_url: string | null;
  created_at: IsoDateTime;
};

// ---------------------------------------------------------------------------
// Travel preferences — GET · PUT /me/preferences
// ---------------------------------------------------------------------------

export type PreferenceLevel = 'yes' | 'no' | 'maybe';

export type TravelPreferences = {
  chat: PreferenceLevel;
  music: PreferenceLevel;
  smoking: PreferenceLevel;
  pets: PreferenceLevel;
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
  reviews_count: number;
  /** CIN + licence approved — the "vérifié" badge riders see. */
  verified: boolean;
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
  /** Planned itinerary for the map (ordered `{ lat, lng }`), or `null` if none. */
  route: Coordinates[] | null;
};

export type TripSortOption = 'departure' | 'price' | 'rating';

// ---------------------------------------------------------------------------
// Promos — GET /promos/banners
// ---------------------------------------------------------------------------

/** A single card in the home-screen promo strip. */
export type PromoBanner = {
  id: Id;
  title: string;
  subtitle: string | null;
  /** In-app route the banner opens, or `null` when it is not tappable. */
  cta_route: string | null;
  /** Background image; `null` renders the brand-tinted fallback. */
  image_url: string | null;
};

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
  | 'expired'
  | 'no_show';

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

/**
 * `GET /bookings/{id}` — the booking detail and its ticket.
 *
 * Extends the list shape with everything the ticket screen shows: the passenger
 * code the driver types to check the rider in, the pickup/dropoff labels, and
 * the cancellation policy text (already localized by the backend).
 */
export type BookingDetail = Booking & {
  /** Four digits, shown to the driver at departure. `§6`. */
  passenger_code: string;
  barcode_url: string | null;
  seat_labels: string[];
  pickup_label: string;
  dropoff_label: string;
  payment_method_label: string;
  cancellation_policy: string;
  /** When an unanswered `pending` request lapses; `null` once answered. */
  expires_at: IsoDateTime | null;
  /** The chat opened with the booking; `null` before it exists. */
  conversation_id: string | null;
};

// ---------------------------------------------------------------------------
// Seat map & quote — GET /trips/{id}/seat-map, POST /trips/{id}/quote
// ---------------------------------------------------------------------------

export type SeatPosition = 'front' | 'rear_left' | 'rear_middle' | 'rear_right';
export type SeatState = 'free' | 'taken' | 'blocked';

export type TripSeat = {
  seat: SeatPosition;
  state: SeatState;
};

/**
 * `POST /trips/{id}/quote` — the fare, computed by the backend.
 *
 * The client never adds these up itself: `total` is authoritative and the parts
 * are for display only. See `utils/money`.
 */
export type Quote = {
  base: Millimes;
  service_fee: Millimes;
  /** Positive amount that was subtracted; `0` when no promo applied. */
  discount: Millimes;
  total: Millimes;
  /** Echoes the code the quote was computed with, or `null`. */
  promo_code: string | null;
};

// ---------------------------------------------------------------------------
// Promos & payment methods — POST /promos/validate, GET /payment-methods
// ---------------------------------------------------------------------------

export type PromoValidation = {
  code: string;
  /** Discount in millimes the code is worth for this trip. */
  discount: Millimes;
  /** User-facing confirmation, e.g. "-20 % appliqués". */
  message: string;
};

/** Matches `rakeb-backend`'s `PaymentMethodType` enum on the wire. */
export type PaymentMethodKind = 'card' | 'mobile_money' | 'cash' | 'wallet';

export type PaymentMethod = {
  id: Id;
  kind: PaymentMethodKind;
  /** Display label, e.g. "Carte •••• 4218" or "Espèces au conducteur". */
  label: string;
  /** Secondary line, e.g. "Expire 07/28"; `null` when there is nothing to add. */
  detail: string | null;
  is_default: boolean;
  /** `true` for `cash` / `wallet` — always present, cannot be added or removed. */
  builtin: boolean;
};

export type MobileMoneyProvider = 'd17' | 'e_dinar' | 'flouci';

// ---------------------------------------------------------------------------
// Wallet — GET /wallet, GET /wallet/transactions
// ---------------------------------------------------------------------------

export type WalletBalance = {
  /** Spendable now, in millimes. */
  available: Millimes;
  /** Earnings still on a payout hold, in millimes. */
  pending: Millimes;
  total: Millimes;
  currency: string;
};

export type WalletTransactionType =
  | 'trip_earning'
  | 'trip_payment'
  | 'topup'
  | 'withdrawal'
  | 'refund'
  | 'referral_credit'
  | 'tip'
  | 'adjustment';

export type WalletTransactionStatus =
  | 'pending'
  | 'available'
  | 'withdrawn'
  | 'reversed';

export type WalletTransaction = {
  id: Id;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  /** Signed: credits positive, debits negative. Millimes. */
  amount: Millimes;
  currency: string;
  description: string | null;
  available_at: IsoDateTime | null;
  created_at: IsoDateTime;
};

// ---------------------------------------------------------------------------
// Live tracking — GET /trips/{id}/tracking
// ---------------------------------------------------------------------------

export type TrackingState = 'not_started' | 'in_progress' | 'completed';

/**
 * `GET /trips/{id}/tracking`.
 *
 * Only the live-position half of the screen. The driver, vehicle and the
 * rider's passenger code come from the trip and the booking — the tracking
 * screen composes all three.
 */
export type TripTracking = {
  trip_id: Id;
  state: TrackingState;
  /** Driver's last known position, or `null` before the trip starts. */
  driver_location: Coordinates | null;
  eta_minutes: number | null;
  /** Metres still to drive to the destination, or `null` when unknown. */
  remaining_distance_m: number | null;
  /** `normal` | `slow` | `unknown`. */
  traffic: string;
  /** True when the position is a live ping rather than a persisted sample. */
  live: boolean;
};

// ---------------------------------------------------------------------------
// Messaging — GET /conversations, GET /conversations/{id}/messages
// ---------------------------------------------------------------------------

export type ConversationPeer = {
  id: Id;
  first_name: string;
  avatar_url: string | null;
};

export type Conversation = {
  id: Id;
  trip_id: Id;
  peer: ConversationPeer;
  /** Route summary, e.g. "Tunis → Sousse · ven. 07:30". */
  trip_label: string;
  last_message: string | null;
  last_message_at: IsoDateTime | null;
  unread_count: number;
};

export type MessageAuthor = 'me' | 'peer';

export type Message = {
  id: Id;
  author: MessageAuthor;
  body: string;
  created_at: IsoDateTime;
};

export type QuickReply = {
  id: Id;
  body: string;
};

// ---------------------------------------------------------------------------
// Reviews & tips — §10
// ---------------------------------------------------------------------------

export type ReviewTag = {
  id: string;
  label: string;
};

export type PendingReview = {
  booking_id: Id;
  /** Route summary for the review prompt. */
  trip_label: string;
  peer_first_name: string;
  trip_date: IsoDateTime;
};

/** Preset tip amounts offered on the review screen, in millimes. */
export type TipPreset = Millimes;

// ---------------------------------------------------------------------------
// Driver — vehicles, publishing, verifications (§7, §2)
// ---------------------------------------------------------------------------

export type Vehicle = {
  id: Id;
  make: string;
  model: string;
  color: string;
  /** Tunisian format, e.g. `204 TU 3456`. */
  plate: string;
  year: number | null;
  /** Passenger seats offered (excludes the driver). */
  seats: number;
  is_default: boolean;
};

/** `GET /trips/price-suggestion` — the client renders the range, never computes it. */
export type PriceSuggestion = {
  suggested: Millimes;
  min: Millimes;
  max: Millimes;
};

/** `GET /me/verifications` — the publish gate is `can_publish`. */
export type Verifications = {
  phone: VerificationStatus;
  email: VerificationStatus;
  cin: VerificationStatus;
  licence: VerificationStatus;
  licence_rejection_reason: string | null;
  can_publish: boolean;
};

/** Buckets for `GET /me/trips?status=`. */
export type DriverTripBucket = 'published' | 'confirmed' | 'completed' | 'cancelled';

/** A booking as the driver sees it in the requests inbox — carries the rider. */
export type BookingRequest = Booking & {
  rider: {
    id: Id;
    display_name: string;
    avatar_url: string | null;
    rating: number | null;
    phone: string | null;
  };
  /** The rider's note left with the request, if any. */
  note: string | null;
  /** When an unanswered `pending` request expires (24 h rule). */
  expires_at: IsoDateTime | null;
};

/** Weekly recurrence for a published trip. */
export type TripRecurrence = {
  /** ISO weekday numbers, 1 = Monday … 7 = Sunday. */
  days: number[];
  /** `yyyy-MM-dd` — last date a child trip is generated for. */
  until: IsoDate;
};

// ---------------------------------------------------------------------------
// Driver's licence verification — admin review queue
// ---------------------------------------------------------------------------

/** A submitted licence never sits in `none` — that status only applies before a first submission. */
export type LicenceReviewStatus = 'pending' | 'approved' | 'rejected';

export type LicenceVerificationApplicant = {
  id: Id;
  display_name: string;
  phone: string;
};

/**
 * `GET /admin/verifications?type=licence` · `GET /admin/verifications/{userId}/licence`.
 *
 * One driver has at most one active licence record — a resubmission after a
 * rejection updates it in place rather than creating a second row. The
 * backend endpoint also serves `cin` rows (`type`); this app only surfaces
 * `licence`, so every row here has `type: 'licence'` already filtered in.
 */
export type LicenceVerification = {
  id: Id;
  user: LicenceVerificationApplicant;
  status: LicenceReviewStatus;
  document_last4: string | null;
  /** `null` until the picked file's `PUT` + confirm round trip is done. */
  front_document_url: string | null;
  submitted_at: IsoDateTime | null;
  reviewed_at: IsoDateTime | null;
  /** Set only when `status` is `rejected`. */
  rejection_reason: string | null;
  /** Admin who last approved/rejected it; `null` before any review. */
  reviewed_by_user_id: Id | null;
};

// ---------------------------------------------------------------------------
// Admin: user directory — `GET/PATCH /admin/users/*`
// ---------------------------------------------------------------------------

export type AdminUserSummary = {
  id: Id;
  phone: string;
  email: string | null;
  display_name: string;
  role: UserRole;
  status: UserStatus;
  rating: number;
  created_at: IsoDateTime;
};

/**
 * `GET /admin/users/{id}`.
 *
 * The backend refuses to let an admin change their *own* status or role
 * (`BAD_REQUEST` — "You cannot change your own account status/role"); the
 * detail screen hides those actions when `id` is the signed-in admin's own.
 */
export type AdminUserDetail = AdminUserSummary & {
  first_name: string | null;
  last_name: string | null;
  phone_verified: boolean;
  email_verified: boolean;
  reviews_count: number;
  trips_as_driver: number;
  trips_as_rider: number;
  referral_code: string;
  verifications: { cin: VerificationStatus; licence: VerificationStatus };
  last_seen_at: IsoDateTime | null;
};

// ---------------------------------------------------------------------------
// Notifications — `GET /me/notifications`
// ---------------------------------------------------------------------------

/** Mirrors the backend `NotificationType` enum (`common/constants/enums.ts`). */
export type NotificationType =
  | 'booking_requested'
  | 'booking_accepted'
  | 'booking_declined'
  | 'booking_cancelled'
  | 'booking_expired'
  | 'new_message'
  | 'departure_reminder'
  | 'trip_started'
  | 'trip_completed'
  | 'trip_cancelled'
  | 'review_request'
  | 'payment_captured'
  | 'payment_refunded'
  | 'wallet_credited'
  | 'trip_alert'
  | 'sos'
  | 'verification_approved'
  | 'verification_rejected';

export type Notification = {
  id: Id;
  type: NotificationType;
  title: string;
  body: string;
  /** Deep-link payload: booking_id / trip_id / conversation_id / message_id / offset. */
  data: Record<string, string>;
  read_at: IsoDateTime | null;
  created_at: IsoDateTime;
};
