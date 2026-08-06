import type { CursorPage } from '@/types/api';

import {
  mockAppConfig,
  mockBookings,
  mockCurrentUser,
  mockServices,
  mockTripSummaries,
  mockTrips,
} from './fixtures';

/**
 * The mock routing table.
 *
 * One entry per endpoint the scaffold actually calls. Anything not listed here
 * returns `501 not_implemented` with the path in the message, which is how you
 * discover that a newly wired endpoint still needs a fixture.
 *
 * To add one: append a `MockRoute`. Paths are matched against the URL *after*
 * the `/v1` prefix, and `:param` segments are captured into `ctx.params`.
 */

export type MockRequestContext = {
  params: Record<string, string>;
  query: Record<string, unknown>;
  body: unknown;
};

export type MockResponse = {
  status: number;
  data: unknown;
};

export type MockRoute = {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** Path pattern relative to `/v1`, e.g. `/trips/:id`. */
  path: string;
  handler: (context: MockRequestContext) => MockResponse;
};

function ok(data: unknown): MockResponse {
  return { status: 200, data };
}

function page<T>(items: T[]): CursorPage<T> {
  // Single page: the scaffold has no fixture large enough to paginate, and a
  // fake cursor would make infinite queries loop forever.
  return { items, next_cursor: null, total: items.length };
}

export const mockRoutes: MockRoute[] = [
  // --- Catalogue & config (features/services) -----------------------------
  { method: 'GET', path: '/services', handler: () => ok(mockServices) },
  { method: 'GET', path: '/config', handler: () => ok(mockAppConfig) },

  // --- Session (features/profile, features/auth) --------------------------
  { method: 'GET', path: '/me', handler: () => ok(mockCurrentUser) },

  {
    method: 'POST',
    path: '/auth/phone/start',
    handler: () => ok({ otp_token: 'mock_otp_token', expires_in: 300, resend_after: 60 }),
  },
  {
    method: 'POST',
    path: '/auth/phone/verify',
    handler: ({ body }) => {
      const code = (body as { code?: string } | null)?.code;
      // Any six-digit code is accepted except `000000`, which exercises the
      // error path without needing a second fixture.
      if (code === '000000') {
        return {
          status: 401,
          data: { code: 'invalid_otp', message: 'Code invalide.', field: 'code' },
        };
      }
      return ok({
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        is_new_user: false,
      });
    },
  },
  {
    method: 'POST',
    path: '/auth/refresh',
    handler: () => ok({ access_token: 'mock_access_token', refresh_token: 'mock_refresh_token' }),
  },
  { method: 'POST', path: '/auth/logout', handler: () => ({ status: 204, data: null }) },

  // --- Carpool search & trips (features/carpool/*) ------------------------
  {
    method: 'GET',
    path: '/trips/search',
    handler: ({ query }) => {
      const from = query.from_place_id;
      const to = query.to_place_id;
      const matches = mockTripSummaries.filter(
        (trip) =>
          (from === undefined || trip.origin.id === from) &&
          (to === undefined || trip.destination.id === to),
      );
      return ok(page(matches));
    },
  },
  {
    method: 'GET',
    path: '/trips/:id',
    handler: ({ params }) => {
      const trip = mockTrips.find((candidate) => candidate.id === params.id);
      return trip
        ? ok(trip)
        : { status: 404, data: { code: 'trip_not_found', message: 'Trajet introuvable.' } };
    },
  },

  // --- Bookings (features/carpool/bookings) -------------------------------
  {
    method: 'GET',
    path: '/bookings',
    handler: ({ query }) => {
      const status = query.status;
      if (status === 'past' || status === 'cancelled') return ok(page([]));
      return ok(page(mockBookings));
    },
  },
  {
    method: 'GET',
    path: '/bookings/:id',
    handler: ({ params }) => {
      const booking = mockBookings.find((candidate) => candidate.id === params.id);
      return booking
        ? ok(booking)
        : { status: 404, data: { code: 'booking_not_found', message: 'Réservation introuvable.' } };
    },
  },
];
