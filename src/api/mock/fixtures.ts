import type {
  AppConfig,
  Booking,
  Place,
  ServiceDefinition,
  Trip,
  TripSummary,
  User,
} from '@/types/models';

/**
 * Fixtures for mock mode.
 *
 * Deliberately tiny: enough for every scaffolded screen to render a realistic
 * shape, not a working backend. There is no persistence, no validation and no
 * state transition — a mutation in mock mode returns a canned response.
 *
 * These simulate what the *server* returns. They intentionally duplicate the
 * offline fallback catalogue in `features/services/fallback-services.ts`; the
 * two answer different questions ("what would the API send?" vs. "what do we
 * show when the API is unreachable?") and are free to diverge.
 */

export const mockServices: ServiceDefinition[] = [
  {
    id: 'carpool',
    status: 'live',
    // Wording differs from the fallback catalogue on purpose: it is how a test
    // can tell the served response apart from the local placeholder data.
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
  feature_flags: {
    instant_book: true,
    wallet: false,
    tipping: false,
  },
  currency: 'TND',
  min_price_per_seat: 2_000,
  max_price_per_seat: 80_000,
  min_app_version: '0.1.0',
};

export const mockCurrentUser: User = {
  id: 'usr_demo_1',
  first_name: 'Amine',
  last_name: 'Ben Salah',
  phone: '+21698123456',
  email: 'amine@example.tn',
  avatar_url: null,
  role: 'both',
  rating: 4.8,
  trips_count: 23,
  member_since: '2025-03-14T09:00:00.000Z',
};

const tunis: Place = {
  id: 'plc_tunis',
  label: 'Tunis',
  governorate: 'Tunis',
  lat: 36.8065,
  lng: 10.1815,
};
const sousse: Place = {
  id: 'plc_sousse',
  label: 'Sousse',
  governorate: 'Sousse',
  lat: 35.8256,
  lng: 10.6084,
};
const sfax: Place = {
  id: 'plc_sfax',
  label: 'Sfax',
  governorate: 'Sfax',
  lat: 34.7406,
  lng: 10.7603,
};

export const mockPlaces: Place[] = [tunis, sousse, sfax];

export const mockTripSummaries: TripSummary[] = [
  {
    id: 'trp_1',
    status: 'published',
    origin: tunis,
    destination: sousse,
    departure_at: '2026-08-10T07:30:00.000Z',
    price_per_seat: 15_800,
    seats_available: 3,
    instant_book: true,
    driver: { id: 'usr_2', first_name: 'Sarra', avatar_url: null, rating: 4.9 },
  },
  {
    id: 'trp_2',
    status: 'published',
    origin: tunis,
    destination: sousse,
    departure_at: '2026-08-10T13:00:00.000Z',
    price_per_seat: 12_000,
    seats_available: 1,
    instant_book: false,
    driver: { id: 'usr_3', first_name: 'Karim', avatar_url: null, rating: 4.6 },
  },
  {
    id: 'trp_3',
    status: 'published',
    origin: sousse,
    destination: sfax,
    departure_at: '2026-08-11T09:15:00.000Z',
    price_per_seat: 18_500,
    seats_available: 2,
    instant_book: true,
    driver: { id: 'usr_4', first_name: 'Nour', avatar_url: null, rating: 5 },
  },
];

export const mockTrips: Trip[] = mockTripSummaries.map((summary) => ({
  ...summary,
  stops: [],
  vehicle: { id: 'veh_1', model: 'Volkswagen Golf', color: 'Gris' },
  max_two_in_back: false,
  cancellation_policy: 'Annulation gratuite jusqu’à 24 h avant le départ.',
}));

export const mockBookings: Booking[] = [
  {
    id: 'bkg_1',
    status: 'confirmed',
    trip: mockTripSummaries[0]!,
    seats: 1,
    total_price: 15_800,
    reservation_code: 'RKB-4821',
    created_at: '2026-08-05T18:20:00.000Z',
  },
  {
    id: 'bkg_2',
    status: 'pending',
    trip: mockTripSummaries[2]!,
    seats: 2,
    total_price: 37_000,
    reservation_code: 'RKB-4822',
    created_at: '2026-08-06T08:05:00.000Z',
  },
];
