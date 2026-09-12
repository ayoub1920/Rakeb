/**
 * Reserved root query scopes.
 *
 * Each feature owns exactly one scope and builds its keys from it in
 * `features/<feature>/keys.ts`. Declaring the scopes centrally is what makes
 * cross-feature invalidation safe: accepting a booking can invalidate
 * `[QUERY_SCOPES.trips]` without guessing how the trips feature spells its key.
 *
 * Add a scope here first, then the feature's key factory.
 */
export const QUERY_SCOPES = {
  services: 'services',
  appConfig: 'app-config',
  session: 'session',
  places: 'places',
  tripSearch: 'trip-search',
  trips: 'trips',
  bookings: 'bookings',
  vehicles: 'vehicles',
  publishing: 'publishing',
  tracking: 'tracking',
  conversations: 'conversations',
  reviews: 'reviews',
  payments: 'payments',
  wallet: 'wallet',
  notifications: 'notifications',
  support: 'support',
  adminLicences: 'admin-licences',
  adminUsers: 'admin-users',
  adminSupportChat: 'admin-support-chat',
  taxiApplication: 'taxi-application',
  taxiRides: 'taxi-rides',
  taxiQuote: 'taxi-quote',
  taxiDispatch: 'taxi-dispatch',
  adminTaxi: 'admin-taxi',
} as const;

export type QueryScope = (typeof QUERY_SCOPES)[keyof typeof QUERY_SCOPES];
