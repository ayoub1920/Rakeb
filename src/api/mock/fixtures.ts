import type {
  AdminUserDetailResponse,
  AdminVerificationResponse,
  BookingTicketResponse,
  ConversationResponse,
  MessageResponse,
  PaymentMethodResponse,
  PendingReviewResponse,
  PlaceResponse,
  PreferencesResponse,
  PromoBannerResponse,
  QuickReplyResponse,
  ReviewTagResponse,
  SeatMapResponse,
  TrackingResponse,
  TripDetailResponse,
  TripSummaryResponse,
  VerificationsResponse,
  WalletBalanceResponse,
  WalletTransactionResponse,
} from '@/types/api-responses';
import type { AppConfig, ServiceDefinition, User } from '@/types/models';

/**
 * Fixtures for mock mode: the wire shapes the NestJS API returns.
 *
 * These match src/types/api-responses.ts, not the app domain model, so mock
 * mode exercises the same feature mapping layer as a real backend. The booking
 * flow mutates mockBookings in place so Activite and the ticket stay
 * consistent within a session; there is no persistence across a reload.
 */

export const mockServices: ServiceDefinition[] = [
  {
    id: 'carpool',
    status: 'live',
    name: 'Covoiturage',
    description: 'Partagez un trajet entre villes tunisiennes et partagez les frais.',
  },
  {
    id: 'taxi',
    status: 'coming_soon',
    name: 'Taxi',
    description: 'Commandez une course en ville. Bientôt disponible.',
  },
  {
    id: 'food',
    status: 'coming_soon',
    name: 'Restauration',
    description: 'Faites-vous livrer un repas. Bientôt disponible.',
  },
  {
    id: 'grocery',
    status: 'coming_soon',
    name: 'Courses',
    description: 'Vos courses livrées à domicile. Bientôt disponible.',
  },
];

export const mockAppConfig: AppConfig = {
  feature_flags: { instant_book: true, wallet: false, tipping: true },
  currency: 'TND',
  min_price_per_seat: 2_000,
  max_price_per_seat: 80_000,
  min_app_version: '0.1.0',
};

export const mockCurrentUser: User = {
  id: 'usr_demo_1',
  first_name: 'Amine',
  last_name: 'Ben Salah',
  display_name: 'Amine Ben Salah',
  phone: '+21698123456',
  email: 'amine@example.tn',
  avatar_url: null,
  role: 'both',
  rating: 4.8,
  trips_count: 23,
  member_since: '2025-03-14T09:00:00.000Z',
};

// --- Places ------------------------------------------------------------

export const mockPlaces: PlaceResponse[] = [
  { id: 'plc_tunis', name: 'Tunis — Bab Alioua', address: null, governorate: 'Tunis', kind: 'meeting_point', lat: 36.8065, lng: 10.1815 },
  { id: 'plc_ariana', name: 'Ariana — Centre', address: null, governorate: 'Ariana', kind: 'city', lat: 36.8625, lng: 10.1956 },
  { id: 'plc_enfidha', name: 'Enfidha — Péage', address: null, governorate: 'Sousse', kind: 'stop', lat: 36.1347, lng: 10.3808 },
  { id: 'plc_sousse', name: 'Sousse — Gare routière', address: null, governorate: 'Sousse', kind: 'station', lat: 35.8256, lng: 10.6084 },
  { id: 'plc_sfax', name: 'Sfax — Route de Gabès', address: null, governorate: 'Sfax', kind: 'city', lat: 34.7406, lng: 10.7603 },
  { id: 'plc_bizerte', name: 'Bizerte — Centre', address: null, governorate: 'Bizerte', kind: 'city', lat: 37.2744, lng: 9.8739 },
  { id: 'plc_nabeul', name: 'Nabeul — Gare', address: null, governorate: 'Nabeul', kind: 'station', lat: 36.4513, lng: 10.7357 },
];

const placeById = (id: string) => mockPlaces.find((p) => p.id === id)!;

// --- Trips -----------------------------------------------------------

function driver(id: string, name: string, rating: number) {
  return { id, display_name: name, avatar_url: null, rating, reviews_count: 0, verified: true };
}

function summaryFrom(
  id: string,
  originId: string,
  destId: string,
  departure_at: string,
  price: number,
  seats: number,
  instant: boolean,
  drv: TripSummaryResponse['driver'],
): TripSummaryResponse {
  const o = placeById(originId);
  const d = placeById(destId);
  return {
    id,
    status: 'published',
    origin_label: o.name,
    destination_label: d.name,
    origin_lat: o.lat,
    origin_lng: o.lng,
    destination_lat: d.lat,
    destination_lng: d.lng,
    departure_at,
    arrival_estimate_at: null,
    distance_m: 176_000,
    duration_s: 8_460,
    price_per_seat: price,
    currency: 'TND',
    seats_available: seats,
    seats_total: seats,
    instant_book: instant,
    direct: true,
    driver: drv,
  };
}

export const mockTripSummaries: TripSummaryResponse[] = [
  summaryFrom('trp_1', 'plc_tunis', 'plc_sousse', '2026-08-10T07:30:00.000Z', 15_000, 3, true, driver('usr_2', 'Sarra', 4.9)),
  summaryFrom('trp_2', 'plc_tunis', 'plc_sousse', '2026-08-10T13:00:00.000Z', 12_000, 1, false, driver('usr_3', 'Karim', 4.6)),
  summaryFrom('trp_3', 'plc_sousse', 'plc_sfax', '2026-08-11T09:15:00.000Z', 18_500, 2, true, driver('usr_4', 'Nour', 5)),
];

function detailFrom(summary: TripSummaryResponse): TripDetailResponse {
  return {
    ...summary,
    vehicle: {
      id: 'veh_1',
      make: summary.id === 'trp_2' ? 'Renault' : 'Volkswagen',
      model: summary.id === 'trp_2' ? 'Clio' : 'Golf 7',
      color: summary.id === 'trp_2' ? 'Grise' : 'Gris',
      photo_url: null,
    },
    stops:
      summary.id === 'trp_1'
        ? [
            { id: 's0', label: summary.origin_label, lat: summary.origin_lat, lng: summary.origin_lng, sequence: 0, kind: 'origin', price_from_origin: 0, eta: null },
            { id: 's1', label: 'Enfidha — Péage', lat: 36.1347, lng: 10.3808, sequence: 1, kind: 'stop', price_from_origin: 8_000, eta: null },
            { id: 's2', label: summary.destination_label, lat: summary.destination_lat, lng: summary.destination_lng, sequence: 2, kind: 'destination', price_from_origin: 15_000, eta: null },
          ]
        : [],
    cancellation_policy: {
      free_before_hours: 24,
      late_refund_percent: 50,
      summary:
        'Annulation gratuite jusqu’à 24 h avant le départ. Passé ce délai, 50 % sont retenus pour le conducteur.',
    },
    max_two_in_back: summary.id === 'trp_3',
    notes: null,
    route: {
      type: 'LineString',
      coordinates: [
        [summary.origin_lng, summary.origin_lat],
        ...(summary.id === 'trp_1' ? ([[10.3808, 36.1347]] as [number, number][]) : []),
        [summary.destination_lng, summary.destination_lat],
      ],
    },
    created_at: '2026-08-01T00:00:00.000Z',
  };
}

export const mockTrips: TripDetailResponse[] = mockTripSummaries.map(detailFrom);

export function findMockTrip(tripId: string): TripDetailResponse | undefined {
  return mockTrips.find((trip) => trip.id === tripId);
}

let tripCounter = mockTripSummaries.length;

/**
 * `POST /trips` — minimal creation, not the real publishing backend.
 *
 * `docs/API_MAPPING.md` §7 lists the full `POST /trips` payload (stops,
 * recurrence, …) as not implemented in mock mode; this exists only so the
 * mock route can prove the licence gate is enforced server-side (§9 of the
 * driver-licence-verification handover), not to model trip publishing.
 */
export function createMockTrip(input: {
  vehicle_id?: string;
  origin?: { lat?: number; lng?: number; label?: string };
  destination?: { lat?: number; lng?: number; label?: string };
  departure_at?: string;
  seats?: number;
  price_per_seat?: number;
  instant_book?: boolean;
  max_two_in_back?: boolean;
  notes?: string | null;
}): TripDetailResponse {
  tripCounter += 1;
  const id = `trp_${tripCounter}`;
  const summary: TripSummaryResponse = {
    id,
    status: 'published',
    origin_label: input.origin?.label ?? 'Départ',
    destination_label: input.destination?.label ?? 'Arrivée',
    origin_lat: input.origin?.lat ?? 0,
    origin_lng: input.origin?.lng ?? 0,
    destination_lat: input.destination?.lat ?? 0,
    destination_lng: input.destination?.lng ?? 0,
    departure_at: input.departure_at ?? new Date().toISOString(),
    arrival_estimate_at: null,
    distance_m: 0,
    duration_s: 0,
    price_per_seat: input.price_per_seat ?? 0,
    currency: 'TND',
    seats_available: input.seats ?? 1,
    seats_total: input.seats ?? 1,
    instant_book: input.instant_book ?? false,
    direct: true,
    driver: driver(mockCurrentUser.id, mockCurrentUser.first_name ?? mockCurrentUser.display_name, mockCurrentUser.rating ?? 0),
  };
  const detail: TripDetailResponse = {
    ...summary,
    vehicle: { id: input.vehicle_id ?? 'veh_1', make: '—', model: '—', color: '—', photo_url: null },
    stops: [],
    cancellation_policy: {
      free_before_hours: 24,
      late_refund_percent: 50,
      summary: 'Annulation gratuite jusqu’à 24 h avant le départ.',
    },
    max_two_in_back: input.max_two_in_back ?? false,
    notes: input.notes ?? null,
    route: {
      type: 'LineString',
      coordinates: [
        [summary.origin_lng, summary.origin_lat],
        [summary.destination_lng, summary.destination_lat],
      ],
    },
    created_at: new Date().toISOString(),
  };
  mockTripSummaries.unshift(summary);
  mockTrips.unshift(detail);
  return detail;
}

export const mockSeatMaps: Record<string, SeatMapResponse> = {
  trp_1: {
    seats: [
      { seat: 'front', state: 'free' },
      { seat: 'rear_left', state: 'free' },
      { seat: 'rear_middle', state: 'blocked' },
      { seat: 'rear_right', state: 'taken' },
    ],
    seats_available: 3,
  },
  trp_2: {
    seats: [
      { seat: 'front', state: 'free' },
      { seat: 'rear_left', state: 'taken' },
      { seat: 'rear_middle', state: 'taken' },
      { seat: 'rear_right', state: 'taken' },
    ],
    seats_available: 1,
  },
  trp_3: {
    seats: [
      { seat: 'front', state: 'free' },
      { seat: 'rear_left', state: 'free' },
      { seat: 'rear_middle', state: 'blocked' },
      { seat: 'rear_right', state: 'free' },
    ],
    seats_available: 2,
  },
};

// --- Promos & payment methods --------------------------------------

export const mockPromoBanners: PromoBannerResponse[] = [
  {
    id: 'promo_first_trip',
    title: '-20 % sur vos 3 premiers trajets',
    subtitle: 'Code RAKEB20 appliqué à la réservation',
    image_url: null,
    action_url: '/carpool/search',
    promo_code: 'RAKEB20',
  },
  {
    id: 'promo_refer',
    title: 'Parrainez un ami',
    subtitle: '5 DT pour vous, 5 DT pour lui',
    image_url: null,
    action_url: null,
    promo_code: null,
  },
];

export const mockPaymentMethods: PaymentMethodResponse[] = [
  { id: 'pm_card', type: 'card', provider: 'stripe', brand: 'visa', last4: '4218', msisdn: null, label: 'Carte •••• 4218', is_default: true, created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'pm_d17', type: 'mobile_money', provider: 'd17', brand: null, last4: null, msisdn: '+216••••••56', label: null, is_default: false, created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'pm_cash', type: 'cash', provider: null, brand: null, last4: null, msisdn: null, label: 'Espèces au conducteur', is_default: false, created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'pm_wallet', type: 'wallet', provider: null, brand: null, last4: null, msisdn: null, label: 'Portefeuille Rakeb', is_default: false, created_at: '2026-01-01T00:00:00.000Z' },
];

export const MOCK_PROMO_CODE = 'RAKEB20';
export const MOCK_PROMO_RATE = 0.2;
export const MOCK_SERVICE_FEE = 800;

// --- Bookings — mutated in place by POST /bookings ------------------

export const mockBookings: BookingTicketResponse[] = [
  {
    id: 'bkg_1',
    status: 'confirmed',
    trip_id: 'trp_1',
    seats: 1,
    seat_codes: ['rear_right'],
    reservation_code: 'RKB-4821',
    price: { base: 15_000, service_fee: 800, discount: 3_000, total: 12_800, refunded: 0, currency: 'TND' },
    message: null,
    pickup_stop_id: null,
    dropoff_stop_id: null,
    conversation_id: 'cnv_1',
    expires_at: null,
    created_at: '2026-08-05T18:20:00.000Z',
    trip: mockTripSummaries[0]!,
    rider: null,
    passenger_code: '4821',
    barcode_url: '',
    ics_url: '',
    cancellation_policy: 'Annulation gratuite jusqu’à 24 h avant le départ, 50 % ensuite.',
  },
  {
    id: 'bkg_2',
    status: 'pending',
    trip_id: 'trp_3',
    seats: 2,
    seat_codes: ['front', 'rear_left'],
    reservation_code: 'RKB-4822',
    price: { base: 37_000, service_fee: 800, discount: 0, total: 37_800, refunded: 0, currency: 'TND' },
    message: null,
    pickup_stop_id: null,
    dropoff_stop_id: null,
    conversation_id: 'cnv_2',
    expires_at: '2026-08-07T08:05:00.000Z',
    created_at: '2026-08-06T08:05:00.000Z',
    trip: mockTripSummaries[2]!,
    rider: null,
    passenger_code: '5590',
    barcode_url: '',
    ics_url: '',
    cancellation_policy: 'Annulation gratuite jusqu’à 24 h avant le départ, 50 % ensuite.',
  },
];

let bookingCounter = mockBookings.length;

/** Builds a booking from a `POST /bookings` body, stores it, and returns it. */
export function createMockBooking(input: {
  trip_id: string;
  seats: number;
  seat_ids?: string[];
  promo_code?: string | null;
  fare: { base: number; service_fee: number; discount: number; total: number };
}): BookingTicketResponse {
  const trip = findMockTrip(input.trip_id) ?? mockTrips[0]!;
  bookingCounter += 1;

  const booking: BookingTicketResponse = {
    id: `bkg_${bookingCounter}`,
    status: trip.instant_book ? 'confirmed' : 'pending',
    trip_id: trip.id,
    seats: input.seats,
    seat_codes: input.seat_ids ?? [],
    reservation_code: `RKB-${4820 + bookingCounter}`,
    price: { ...input.fare, refunded: 0, currency: 'TND' },
    message: null,
    pickup_stop_id: null,
    dropoff_stop_id: null,
    conversation_id: `cnv_${bookingCounter}`,
    expires_at: trip.instant_book ? null : new Date(Date.now() + 24 * 3_600_000).toISOString(),
    created_at: new Date().toISOString(),
    trip: mockTripSummaries.find((s) => s.id === trip.id) ?? mockTripSummaries[0]!,
    rider: null,
    passenger_code: String(1000 + Math.floor(Math.random() * 9000)),
    barcode_url: '',
    ics_url: '',
    cancellation_policy: 'Annulation gratuite jusqu’à 24 h avant le départ, 50 % ensuite.',
  };

  mockBookings.unshift(booking);
  return booking;
}

// --- Tracking ----------------------------------------------------

export function buildMockTracking(tripId: string): TrackingResponse {
  const trip = findMockTrip(tripId) ?? mockTrips[0]!;
  return {
    trip_id: trip.id,
    trip_status: 'in_progress',
    position: { lat: 36.8189, lng: 10.1658, heading: 210, speed: 14, recorded_at: new Date().toISOString() },
    eta_at: new Date(Date.now() + 4 * 60_000).toISOString(),
    remaining_distance_m: 3_200,
    traffic: 'normal',
    live: true,
  };
}

// --- Conversations & messages ----------------------------------

function msg(id: string, sender: string | null, body: string, created_at: string): MessageResponse {
  return { id, conversation_id: 'cnv_1', sender_id: sender, type: 'text', body, created_at };
}

export const mockConversations: ConversationResponse[] = [
  {
    id: 'cnv_1',
    booking_id: 'bkg_1',
    trip_id: 'trp_1',
    trip_label: 'Tunis → Sousse',
    departure_at: '2026-08-10T07:30:00.000Z',
    counterpart: { id: 'usr_2', display_name: 'Sarra', avatar_url: null, role: 'driver' },
    last_message: msg('m5', 'usr_2', 'Nickel. Golf grise, 204 TU 3456. À demain !', '2026-08-09T18:51:00.000Z'),
    unread_count: 0,
    status: 'open',
    last_message_at: '2026-08-09T18:51:00.000Z',
  },
  {
    id: 'cnv_2',
    booking_id: 'bkg_2',
    trip_id: 'trp_3',
    trip_label: 'Sousse → Sfax',
    departure_at: '2026-08-11T09:15:00.000Z',
    counterpart: { id: 'usr_4', display_name: 'Nour', avatar_url: null, role: 'driver' },
    last_message: msg('m_c2', 'usr_4', 'Je confirme votre place, à samedi.', '2026-08-07T12:20:00.000Z'),
    unread_count: 2,
    status: 'open',
    last_message_at: '2026-08-07T12:20:00.000Z',
  },
];

/** Newest first — the thread renders inverted. `usr_demo_1` is the current user. */
export const mockMessagesByConversation: Record<string, MessageResponse[]> = {
  cnv_1: [
    msg('m5', 'usr_2', 'Nickel. Golf grise, 204 TU 3456. À demain !', '2026-08-09T18:51:00.000Z'),
    msg('m4', 'usr_demo_1', 'Parfait. Je serai là à 07:20, j’ai un seul sac.', '2026-08-09T18:49:00.000Z'),
    msg('m3', 'usr_2', 'Bonjour ! Je vous prends devant la station Agil vers 07:25 ?', '2026-08-09T18:45:00.000Z'),
    msg('m1', 'usr_demo_1', 'Bonjour, je réserve une place pour vendredi.', '2026-08-08T18:40:00.000Z'),
  ],
  cnv_2: [
    msg('m_c2', 'usr_4', 'Je confirme votre place, à samedi.', '2026-08-07T12:20:00.000Z'),
    msg('m_c1', 'usr_demo_1', 'Bonjour, deux places si possible.', '2026-08-07T12:05:00.000Z'),
  ],
};

export const mockQuickReplies: QuickReplyResponse[] = [
  { code: 'on_my_way', label: 'Je suis en route', audience: 'both' },
  { code: 'running_late', label: '5 min de retard', audience: 'both' },
  { code: 'im_here', label: 'Je vous attends devant la station', audience: 'both' },
  { code: 'thanks', label: 'Merci !', audience: 'both' },
];

let messageCounter = 0;

export function appendMockMessage(conversationId: string, body: string): MessageResponse {
  messageCounter += 1;
  const message: MessageResponse = {
    id: `m_new_${messageCounter}`,
    conversation_id: conversationId,
    sender_id: 'usr_demo_1',
    type: 'text',
    body,
    created_at: new Date().toISOString(),
  };
  const thread = mockMessagesByConversation[conversationId];
  if (thread) thread.unshift(message);
  else mockMessagesByConversation[conversationId] = [message];
  const conversation = mockConversations.find((c) => c.id === conversationId);
  if (conversation) {
    conversation.last_message = message;
    conversation.last_message_at = message.created_at;
  }
  return message;
}

// --- Reviews ---------------------------------------------------

export const mockReviewTags: ReviewTagResponse[] = [
  { code: 'punctual', label: 'Ponctuel', direction: 'both' },
  { code: 'safe_driving', label: 'Conduite prudente', direction: 'rider_to_driver' },
  { code: 'friendly', label: 'Sympa', direction: 'both' },
  { code: 'clean_car', label: 'Voiture propre', direction: 'rider_to_driver' },
  { code: 'good_music', label: 'Bonne musique', direction: 'rider_to_driver' },
];

export const mockPendingReviews: PendingReviewResponse[] = [
  {
    booking_id: 'bkg_1',
    trip_id: 'trp_1',
    trip_label: 'Tunis → Sousse · ven. 31 juil.',
    departure_at: '2026-07-31T07:30:00.000Z',
    target_user_id: 'usr_2',
    target_display_name: 'Sarra',
    target_avatar_url: null,
    direction: 'rider_to_driver',
  },
];

// --- Uploads — POST /uploads/sign, POST /uploads/{id}/confirm ----------
//
// Mirrors `rakeb-backend`'s presigned-URL flow closely enough to exercise the
// same client code path (`features/uploads/api.ts`): sign returns a "URL" the
// mock adapter itself also serves as a route (so the client's real `fetch`
// PUT succeeds against it), confirm flips it to `uploaded`.

type MockUpload = {
  id: string;
  purpose: string;
  mime_type: string;
  size_bytes: number;
  status: 'pending' | 'uploaded';
  url: string;
  created_at: string;
};

export const mockUploads: MockUpload[] = [];
let uploadCounter = 0;

export function signMockUpload(purpose: string, mimeType: string, sizeBytes: number) {
  uploadCounter += 1;
  const id = `upl_${uploadCounter}`;
  const upload: MockUpload = {
    id,
    purpose,
    mime_type: mimeType,
    size_bytes: sizeBytes,
    status: 'pending',
    url: `mock://uploads/${id}`,
    created_at: new Date().toISOString(),
  };
  mockUploads.push(upload);
  return {
    upload_id: id,
    url: `/mock-uploads/${id}`,
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    object_key: `${purpose}/${id}`,
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
    confirm_url: `/uploads/${id}/confirm`,
  };
}

export function confirmMockUpload(id: string): MockUpload | undefined {
  const upload = mockUploads.find((u) => u.id === id);
  if (!upload) return undefined;
  upload.status = 'uploaded';
  return upload;
}

function findMockUpload(id: string | null): MockUpload | undefined {
  return id ? mockUploads.find((u) => u.id === id) : undefined;
}

// --- Verifications & driver's licence review --------------------------
//
// `mockCurrentUser` doubles as whichever role is being exercised: a rider or
// driver testing the publish gate, or (via `POST /dev/become-admin`, reachable
// from `/dev`) the admin reviewing the queue. There is only one identity in
// mock mode, so "another user's licence" cannot be modelled here — see the
// driver-licence-verification handover's "Problems" section.

export let mockVerifications: VerificationsResponse = {
  phone: 'approved',
  email: 'approved',
  cin: 'approved',
  licence: 'none',
  cin_rejection_reason: null,
  licence_rejection_reason: null,
  can_publish_trips: false,
};

/** Mirrors `rakeb-backend`'s `AdminVerificationResponse` — see `admin-verification.dto.ts`. */
export const mockLicenceVerifications: AdminVerificationResponse[] = [];

let licenceVerificationCounter = 0;

/** `POST /me/verifications/licence` — upserts the caller's record and flips the gate to `pending`. */
export function submitMockLicence(frontUploadId: string): VerificationsResponse {
  const upload = findMockUpload(frontUploadId);
  const now = new Date().toISOString();
  const existing = mockLicenceVerifications.find((v) => v.user_id === mockCurrentUser.id);

  if (existing) {
    existing.front_upload_id = frontUploadId;
    existing.front_upload_url = upload?.url ?? null;
    existing.status = 'pending';
    existing.submitted_at = now;
    existing.reviewed_at = null;
    existing.rejection_reason = null;
    existing.reviewed_by_user_id = null;
  } else {
    licenceVerificationCounter += 1;
    mockLicenceVerifications.unshift({
      id: `lic_${licenceVerificationCounter}`,
      user_id: mockCurrentUser.id,
      display_name: mockCurrentUser.display_name,
      phone: mockCurrentUser.phone,
      type: 'licence',
      status: 'pending',
      document_last4: null,
      submitted_at: now,
      front_upload_id: frontUploadId,
      back_upload_id: null,
      front_upload_url: upload?.url ?? null,
      back_upload_url: null,
      reviewed_at: null,
      reviewed_by_user_id: null,
      rejection_reason: null,
      created_at: now,
    });
  }

  mockVerifications = {
    ...mockVerifications,
    licence: 'pending',
    licence_rejection_reason: null,
    can_publish_trips: false,
  };
  return mockVerifications;
}

/** `POST /admin/verifications/{userId}/licence/review`. */
export function reviewMockLicence(
  userId: string,
  decision: 'approved' | 'rejected',
  reason?: string,
): AdminVerificationResponse | undefined {
  const record = mockLicenceVerifications.find((v) => v.user_id === userId && v.type === 'licence');
  if (!record) return undefined;

  record.status = decision;
  record.reviewed_at = new Date().toISOString();
  record.rejection_reason = decision === 'rejected' ? (reason ?? null) : null;
  record.reviewed_by_user_id = mockCurrentUser.id;

  // Mock mode has one shared identity — when the record under review is that
  // same user's, mirror the decision onto `GET /me/verifications` so the
  // publish gate reflects it immediately, exactly as two separate accounts
  // (driver + admin) would see it against a real backend.
  if (record.user_id === mockCurrentUser.id) {
    mockVerifications = {
      ...mockVerifications,
      licence: decision,
      licence_rejection_reason: record.rejection_reason,
      can_publish_trips: decision === 'approved',
    };
  }
  return record;
}

// --- Admin: user directory -------------------------------------------
//
// Mirrors `rakeb-backend`'s `admin-users.controller.ts`. `mockCurrentUser` is
// always row 1 (so an admin can find their own account); the rest are static
// so search/filter have something to show offline.

function makeMockUser(over: Partial<AdminUserDetailResponse> & { id: string }): AdminUserDetailResponse {
  return {
    id: over.id,
    phone: over.phone ?? '+2169000000',
    email: over.email ?? null,
    display_name: over.display_name ?? 'Rakeb user',
    role: over.role ?? 'rider',
    status: over.status ?? 'active',
    rating: over.rating ?? 0,
    created_at: over.created_at ?? '2026-01-01T00:00:00.000Z',
    first_name: over.first_name ?? null,
    last_name: over.last_name ?? null,
    phone_verified: over.phone_verified ?? true,
    email_verified: over.email_verified ?? false,
    reviews_count: over.reviews_count ?? 0,
    trips_as_driver: over.trips_as_driver ?? 0,
    trips_as_rider: over.trips_as_rider ?? 0,
    referral_code: over.referral_code ?? 'RK000000',
    verifications: over.verifications ?? { cin: 'none', licence: 'none' },
    last_seen_at: over.last_seen_at ?? null,
  };
}

export const mockUsers: AdminUserDetailResponse[] = [
  makeMockUser({
    id: mockCurrentUser.id,
    phone: mockCurrentUser.phone,
    email: mockCurrentUser.email,
    display_name: mockCurrentUser.display_name,
    role: mockCurrentUser.role,
    status: 'active',
    rating: mockCurrentUser.rating ?? 4.8,
    first_name: mockCurrentUser.first_name,
    last_name: mockCurrentUser.last_name,
    email_verified: true,
    reviews_count: 12,
    trips_as_driver: 18,
    trips_as_rider: 5,
    referral_code: 'RKDEMO01',
    verifications: { cin: 'approved', licence: 'approved' },
    created_at: mockCurrentUser.member_since ?? '2025-03-14T09:00:00.000Z',
  }),
  makeMockUser({
    id: 'usr_2',
    phone: '+21697654321',
    email: 'sarra@example.tn',
    display_name: 'Sarra Trabelsi',
    role: 'driver',
    rating: 4.9,
    first_name: 'Sarra',
    last_name: 'Trabelsi',
    trips_as_driver: 40,
    reviews_count: 33,
    verifications: { cin: 'approved', licence: 'approved' },
  }),
  makeMockUser({
    id: 'usr_3',
    phone: '+21696112233',
    email: null,
    display_name: 'Karim B.',
    role: 'rider',
    status: 'suspended',
    rating: 3.1,
    first_name: 'Karim',
    trips_as_rider: 7,
    verifications: { cin: 'pending', licence: 'none' },
  }),
  makeMockUser({
    id: 'usr_support_1',
    phone: '+21691000001',
    email: 'support@rakeb.tn',
    display_name: 'Rakeb Support',
    role: 'support',
    verifications: { cin: 'none', licence: 'none' },
  }),
];

export function findMockUser(id: string): AdminUserDetailResponse | undefined {
  return mockUsers.find((u) => u.id === id);
}

/** `PATCH /admin/users/{id}/status` · `/role`. Rejects acting on yourself, like the real backend. */
export function updateMockUser(
  actorId: string,
  id: string,
  patch: { status?: string; role?: string },
): AdminUserDetailResponse | { error: 'not_found' | 'self' } {
  const user = findMockUser(id);
  if (!user) return { error: 'not_found' };
  if (id === actorId) return { error: 'self' };
  if (patch.status) user.status = patch.status;
  if (patch.role) user.role = patch.role;
  // Keep the licence-review fixtures coherent if this is the demo user.
  if (id === mockCurrentUser.id && patch.role) mockCurrentUser.role = patch.role as User['role'];
  return user;
}

// --- Profile edit & travel preferences ------------------------------

/** `PATCH /me` — merges the patch into `mockCurrentUser` and returns it. */
export function updateMockProfile(patch: Partial<User>): User {
  Object.assign(mockCurrentUser, patch);
  return mockCurrentUser;
}

export const mockPreferences: PreferencesResponse = {
  chat: 'yes',
  music: 'maybe',
  smoking: 'no',
  pets: 'maybe',
};

export function setMockPreferences(next: PreferencesResponse): PreferencesResponse {
  Object.assign(mockPreferences, next);
  return mockPreferences;
}

// --- Payment methods (mutated in place) ----------------------------

let paymentMethodCounter = mockPaymentMethods.length;

export function addMockPaymentMethod(input: {
  type: 'card' | 'mobile_money';
  provider?: string | null;
  brand?: string | null;
  last4?: string | null;
  msisdn?: string | null;
  label?: string | null;
  set_default?: boolean;
}): PaymentMethodResponse {
  paymentMethodCounter += 1;
  if (input.set_default) mockPaymentMethods.forEach((m) => (m.is_default = false));
  const method: PaymentMethodResponse = {
    id: `pm_new_${paymentMethodCounter}`,
    type: input.type,
    provider: input.provider ?? null,
    brand: input.brand ?? (input.type === 'card' ? 'visa' : null),
    last4: input.last4 ?? (input.type === 'card' ? '4242' : null),
    msisdn: input.msisdn ?? null,
    label: input.label ?? null,
    is_default: Boolean(input.set_default),
    created_at: new Date().toISOString(),
  };
  mockPaymentMethods.push(method);
  return method;
}

export function updateMockPaymentMethod(
  id: string,
  patch: { is_default?: boolean; label?: string },
): PaymentMethodResponse | undefined {
  const method = mockPaymentMethods.find((m) => m.id === id);
  if (!method) return undefined;
  if (patch.is_default) {
    mockPaymentMethods.forEach((m) => (m.is_default = false));
    method.is_default = true;
  }
  if (patch.label !== undefined) method.label = patch.label;
  return method;
}

export function removeMockPaymentMethod(id: string): boolean {
  const index = mockPaymentMethods.findIndex((m) => m.id === id);
  if (index < 0) return false;
  mockPaymentMethods.splice(index, 1);
  return true;
}

// --- Wallet (mutated in place) ------------------------------------

export const mockWallet: WalletBalanceResponse = {
  available: 45_000,
  pending: 15_800,
  total: 60_800,
  currency: 'TND',
};

let walletTxnCounter = 0;
export const mockWalletTransactions: WalletTransactionResponse[] = [
  {
    id: 'wt_1',
    type: 'trip_earning',
    status: 'pending',
    amount: 15_800,
    currency: 'TND',
    description: 'Revenu de trajet',
    reference_type: 'booking',
    reference_id: 'bkg_1',
    available_at: new Date(Date.now() + 12 * 3_600_000).toISOString(),
    created_at: '2026-08-09T18:00:00.000Z',
  },
  {
    id: 'wt_2',
    type: 'trip_payment',
    status: 'available',
    amount: -12_800,
    currency: 'TND',
    description: 'Paiement de trajet',
    reference_type: 'booking',
    reference_id: 'bkg_2',
    available_at: null,
    created_at: '2026-08-05T18:20:00.000Z',
  },
  {
    id: 'wt_3',
    type: 'referral_credit',
    status: 'available',
    amount: 5_000,
    currency: 'TND',
    description: 'Crédit de parrainage',
    reference_type: 'referral',
    reference_id: 'usr_2',
    available_at: null,
    created_at: '2026-07-20T10:00:00.000Z',
  },
];

function recomputeMockWallet(): void {
  mockWallet.available = mockWalletTransactions
    .filter((t) => t.status === 'available' || t.status === 'withdrawn')
    .reduce((sum, t) => sum + t.amount, 0);
  mockWallet.pending = mockWalletTransactions
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);
  mockWallet.total = mockWallet.available + mockWallet.pending;
}
recomputeMockWallet();

/** `POST /wallet/topup` — credits the wallet immediately in mock mode. */
export function mockTopup(amount: number): {
  payment_id: string;
  status: string;
  amount: number;
  available_balance: number;
  currency: string;
} {
  walletTxnCounter += 1;
  mockWalletTransactions.unshift({
    id: `wt_new_${walletTxnCounter}`,
    type: 'topup',
    status: 'available',
    amount,
    currency: 'TND',
    description: 'Recharge',
    reference_type: null,
    reference_id: null,
    available_at: null,
    created_at: new Date().toISOString(),
  });
  recomputeMockWallet();
  return {
    payment_id: `pay_${walletTxnCounter}`,
    status: 'captured',
    amount,
    available_balance: mockWallet.available,
    currency: 'TND',
  };
}

/** `POST /wallet/withdraw` — reserves the funds as a negative entry. */
export function mockWithdraw(amount: number):
  | { transaction_id: string; amount: number; status: string; available_balance: number; currency: string }
  | { error: 'insufficient' } {
  if (mockWallet.available < amount) return { error: 'insufficient' };
  walletTxnCounter += 1;
  const id = `wt_new_${walletTxnCounter}`;
  mockWalletTransactions.unshift({
    id,
    type: 'withdrawal',
    status: 'available',
    amount: -amount,
    currency: 'TND',
    description: 'Retrait',
    reference_type: null,
    reference_id: null,
    available_at: null,
    created_at: new Date().toISOString(),
  });
  recomputeMockWallet();
  return {
    transaction_id: id,
    amount,
    status: 'pending',
    available_balance: mockWallet.available,
    currency: 'TND',
  };
}

/** `POST /conversations/{id}/read` — clears the unread count on the list fixture. */
export function markMockConversationRead(conversationId: string): { read_at: string } {
  const conversation = mockConversations.find((c) => c.id === conversationId);
  if (conversation) conversation.unread_count = 0;
  return { read_at: new Date().toISOString() };
}
