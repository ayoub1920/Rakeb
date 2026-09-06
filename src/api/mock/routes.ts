import {
  addMockPaymentMethod,
  appendMockMessage,
  buildMockTracking,
  confirmMockUpload,
  createMockBooking,
  createMockTrip,
  findMockTrip,
  findMockUser,
  markMockConversationRead,
  mockAppConfig,
  mockBookings,
  mockConversations,
  mockCurrentUser,
  mockLicenceVerifications,
  mockMessagesByConversation,
  mockPaymentMethods,
  mockPendingReviews,
  mockPlaces,
  mockPreferences,
  mockPromoBanners,
  mockQuickReplies,
  mockReviewTags,
  mockSeatMaps,
  mockServices,
  mockTripSummaries,
  mockUploads,
  mockUsers,
  mockVerifications,
  mockWallet,
  mockWalletTransactions,
  mockTopup,
  mockWithdraw,
  removeMockPaymentMethod,
  reviewMockLicence,
  setMockPreferences,
  signMockUpload,
  submitMockLicence,
  updateMockPaymentMethod,
  updateMockProfile,
  updateMockUser,
  MOCK_PROMO_CODE,
  MOCK_PROMO_RATE,
  MOCK_SERVICE_FEE,
} from './fixtures';

/**
 * The mock routing table.
 *
 * Handlers return the **wire** shapes (`src/types/api-responses.ts`), the same
 * as the NestJS backend, so mock mode exercises the feature mapping layer
 * exactly as a real backend does. Anything not listed here returns
 * `501 not_implemented` with the path in the message.
 *
 * More specific paths must be listed before their `:param` sibling
 * (`/places/autocomplete` before `/places/:id`).
 */

export type MockRequestContext = {
  params: Record<string, string>;
  query: Record<string, unknown>;
  body: unknown;
};

export type MockResponse = { status: number; data: unknown };

export type MockRoute = {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  handler: (context: MockRequestContext) => MockResponse;
};

function ok(data: unknown): MockResponse {
  return { status: 200, data };
}

function notFound(code: string, message: string): MockResponse {
  return { status: 404, data: { code, message } };
}

/** `rakeb-backend`'s `@Roles(UserRole.ADMIN, UserRole.SUPPORT)` on `/admin/*`. */
function isStaff(): boolean {
  return mockCurrentUser.role === 'admin' || mockCurrentUser.role === 'support';
}

/** Every `/admin/*` handler below returns this for a non-staff caller. */
function forbidden(): MockResponse {
  return { status: 403, data: { code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs.' } };
}

/** The `{ items, next_cursor, has_more, total }` envelope the backend uses. */
function page<T>(items: T[]) {
  return { items, next_cursor: null, has_more: false, total: items.length };
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** base + flat service fee − promo discount, matching `POST /trips/{id}/quote`. */
function computeFare(pricePerSeat: number, seats: number, promoCode?: string | null) {
  const base = pricePerSeat * seats;
  const applied = promoCode?.toUpperCase() === MOCK_PROMO_CODE;
  const discount = applied ? Math.round(base * MOCK_PROMO_RATE) : 0;
  return {
    base,
    service_fee: MOCK_SERVICE_FEE,
    discount,
    total: base + MOCK_SERVICE_FEE - discount,
    currency: 'TND',
    promo_code: applied ? MOCK_PROMO_CODE : '',
    seats,
  };
}

export const mockRoutes: MockRoute[] = [
  // --- Catalogue & config ---------------------------------------------
  { method: 'GET', path: '/services', handler: () => ok(mockServices) },
  { method: 'GET', path: '/config', handler: () => ok(mockAppConfig) },
  { method: 'GET', path: '/me', handler: () => ok(mockCurrentUser) },
  {
    method: 'PATCH',
    path: '/me',
    handler: ({ body }) => {
      const patch = (body ?? {}) as Record<string, unknown>;
      const allowed = ['first_name', 'last_name', 'birth_date', 'email', 'bio', 'locale'] as const;
      const clean: Record<string, unknown> = {};
      for (const key of allowed) if (patch[key] !== undefined) clean[key] = patch[key];
      return ok(updateMockProfile(clean));
    },
  },
  {
    method: 'POST',
    path: '/me/avatar',
    handler: ({ body }) => {
      const uploadId = asString((body as { upload_id?: unknown } | null)?.upload_id);
      if (!uploadId) {
        return { status: 422, data: { code: 'VALIDATION_ERROR', message: 'upload_id requis.', field: 'upload_id' } };
      }
      const upload = mockUploads.find((u) => u.id === uploadId);
      updateMockProfile({ avatar_url: upload?.url ?? `mock://avatar/${uploadId}` });
      return ok({ avatar_url: mockCurrentUser.avatar_url, upload_id: uploadId });
    },
  },
  { method: 'GET', path: '/me/preferences', handler: () => ok(mockPreferences) },
  {
    method: 'PUT',
    path: '/me/preferences',
    handler: ({ body }) => {
      const p = (body ?? {}) as Record<string, string>;
      const levels = ['yes', 'no', 'maybe'];
      for (const key of ['chat', 'music', 'smoking', 'pets']) {
        if (!levels.includes(p[key] ?? '')) {
          return { status: 422, data: { code: 'VALIDATION_ERROR', message: `${key} invalide.`, field: key } };
        }
      }
      return ok(
        setMockPreferences({
          chat: p.chat!,
          music: p.music!,
          smoking: p.smoking!,
          pets: p.pets!,
        }),
      );
    },
  },
  {
    method: 'PATCH',
    path: '/me/role',
    handler: ({ body }) => {
      const role = (body as { role?: string } | null)?.role;
      if (role === 'admin' || role === 'support') {
        // Matches the real contract (`rakeb-backend`'s `SELF_ASSIGNABLE_ROLES`
        // / `features/profile/api.ts`: "Staff roles cannot be self-assigned").
        // Becoming admin in mock mode goes through the dev-only
        // `POST /dev/become-admin` instead — see `src/app/dev`.
        return {
          status: 403,
          data: { code: 'FORBIDDEN', message: 'Ce rôle ne peut pas être choisi soi-même.' },
        };
      }
      if (role !== 'rider' && role !== 'driver' && role !== 'both') {
        return { status: 422, data: { code: 'invalid_role', message: 'Rôle invalide.', field: 'role' } };
      }
      mockCurrentUser.role = role;
      return ok(mockCurrentUser);
    },
  },
  {
    method: 'POST',
    path: '/dev/become-admin',
    // Mock-only convenience so `/dev` can exercise the admin queue locally —
    // there is no equivalent client-reachable endpoint on a real backend
    // (there, use `pnpm admin:promote <phone> admin` in `rakeb-backend`).
    handler: () => {
      mockCurrentUser.role = 'admin';
      return ok(mockCurrentUser);
    },
  },

  // --- Uploads — sign / confirm ---------------------------------------
  {
    method: 'POST',
    path: '/uploads/sign',
    handler: ({ body }) => {
      const payload = (body ?? {}) as { purpose?: string; mime_type?: string; size_bytes?: number };
      if (!payload.purpose || !payload.mime_type || !payload.size_bytes) {
        return {
          status: 422,
          data: { code: 'VALIDATION_ERROR', message: 'purpose, mime_type et size_bytes sont requis.' },
        };
      }
      return { status: 201, data: signMockUpload(payload.purpose, payload.mime_type, payload.size_bytes) };
    },
  },
  {
    // The mock adapter also answers the signed "PUT" URL it hands out, so the
    // client's real `fetch(signed.url, { method: 'PUT', ... })` succeeds —
    // `features/uploads/api.ts` never knows it isn't talking to S3.
    method: 'PUT',
    path: '/mock-uploads/:id',
    handler: () => ({ status: 200, data: null }),
  },
  {
    method: 'POST',
    path: '/uploads/:id/confirm',
    handler: ({ params }) => {
      const upload = confirmMockUpload(params.id);
      return upload
        ? ok(upload)
        : { status: 400, data: { code: 'UPLOAD_NOT_FOUND', message: 'Upload introuvable.', field: 'upload_id' } };
    },
  },

  // --- Verifications — `API Rakeb.md` §2 -----------------------------
  { method: 'GET', path: '/me/verifications', handler: () => ok(mockVerifications) },
  {
    method: 'POST',
    path: '/me/verifications/licence',
    handler: ({ body }) => {
      const frontUploadId = asString((body as { front_upload_id?: unknown } | null)?.front_upload_id);
      const upload = frontUploadId ? mockUploads.find((u) => u.id === frontUploadId) : undefined;
      if (!upload) {
        return {
          status: 422,
          data: { code: 'VALIDATION_ERROR', message: 'front_upload_id est requis.', field: 'front_upload_id' },
        };
      }
      if (upload.status !== 'uploaded') {
        return {
          status: 400,
          data: {
            code: 'UPLOAD_NOT_CONFIRMED',
            message: `Confirmez l'upload ${upload.id} avant de le soumettre.`,
            field: 'front_upload_id',
          },
        };
      }
      return { status: 201, data: submitMockLicence(upload.id) };
    },
  },

  // --- Admin: verification review queue -------------------------------
  //
  // Not in `API Rakeb.md` — mirrors `rakeb-backend`'s
  // `admin-verifications.controller.ts`, which also serves `cin` rows; this
  // app only surfaces `licence` (`features/admin/licences`). Every handler
  // re-checks `mockCurrentUser.role`, the same enforcement a real backend
  // applies from the request's JWT: reaching these without `admin`/`support`
  // always fails, regardless of what the client-side route guard
  // (`app/admin/_layout.tsx`) would have shown.
  {
    method: 'GET',
    path: '/admin/verifications',
    handler: ({ query }) => {
      if (!isStaff()) return forbidden();
      const type = asString(query.type);
      const status = asString(query.status) ?? 'pending';
      const items = mockLicenceVerifications.filter(
        (v) => (!type || v.type === type) && v.status === status,
      );
      return ok(page(items));
    },
  },
  {
    method: 'GET',
    path: '/admin/verifications/:userId/:type',
    handler: ({ params }) => {
      if (!isStaff()) return forbidden();
      const record = mockLicenceVerifications.find(
        (v) => v.user_id === params.userId && v.type === params.type,
      );
      return record ? ok(record) : notFound('NOT_FOUND', 'Vérification introuvable.');
    },
  },
  {
    method: 'POST',
    path: '/admin/verifications/:userId/:type/review',
    handler: ({ params, body }) => {
      if (!isStaff()) return forbidden();
      const payload = (body ?? {}) as { status?: string; reason?: string };
      if (payload.status !== 'approved' && payload.status !== 'rejected') {
        return { status: 422, data: { code: 'VALIDATION_ERROR', message: 'status invalide.', field: 'status' } };
      }
      const record = reviewMockLicence(params.userId, payload.status, payload.reason);
      return record ? { status: 204, data: null } : notFound('NOT_FOUND', 'Vérification introuvable.');
    },
  },

  // --- Admin: user directory ----------------------------------------
  {
    method: 'GET',
    path: '/admin/users',
    handler: ({ query }) => {
      if (!isStaff()) return forbidden();
      const q = asString(query.q)?.toLowerCase();
      const role = asString(query.role);
      const status = asString(query.status);
      const items = mockUsers.filter((u) => {
        if (role && u.role !== role) return false;
        if (status && u.status !== status) return false;
        if (q) {
          const haystack = `${u.phone} ${u.email ?? ''} ${u.display_name}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      });
      return ok(page(items));
    },
  },
  {
    method: 'GET',
    path: '/admin/users/:id',
    handler: ({ params }) => {
      if (!isStaff()) return forbidden();
      const user = findMockUser(params.id);
      return user ? ok(user) : notFound('NOT_FOUND', 'Utilisateur introuvable.');
    },
  },
  {
    method: 'PATCH',
    path: '/admin/users/:id/status',
    handler: ({ params, body }) => {
      if (mockCurrentUser.role !== 'admin') return forbidden();
      const status = asString((body as { status?: unknown } | null)?.status);
      if (status !== 'active' && status !== 'suspended' && status !== 'deleted') {
        return { status: 422, data: { code: 'VALIDATION_ERROR', message: 'status invalide.', field: 'status' } };
      }
      const result = updateMockUser(mockCurrentUser.id, params.id, { status });
      if ('error' in result) {
        return result.error === 'self'
          ? { status: 400, data: { code: 'BAD_REQUEST', message: 'Vous ne pouvez pas modifier votre propre compte.', field: 'status' } }
          : notFound('NOT_FOUND', 'Utilisateur introuvable.');
      }
      return ok(result);
    },
  },
  {
    method: 'PATCH',
    path: '/admin/users/:id/role',
    handler: ({ params, body }) => {
      if (mockCurrentUser.role !== 'admin') return forbidden();
      const role = asString((body as { role?: unknown } | null)?.role);
      const roles = ['rider', 'driver', 'both', 'admin', 'support'];
      if (!role || !roles.includes(role)) {
        return { status: 422, data: { code: 'VALIDATION_ERROR', message: 'role invalide.', field: 'role' } };
      }
      const result = updateMockUser(mockCurrentUser.id, params.id, { role });
      if ('error' in result) {
        return result.error === 'self'
          ? { status: 400, data: { code: 'BAD_REQUEST', message: 'Vous ne pouvez pas modifier votre propre rôle.', field: 'role' } }
          : notFound('NOT_FOUND', 'Utilisateur introuvable.');
      }
      return ok(result);
    },
  },

  // --- Auth ---------------------------------------------------------
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
      if (code === '000000') {
        return { status: 401, data: { code: 'invalid_otp', message: 'Code invalide.', field: 'code' } };
      }
      return ok({
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_in: 900,
        token_type: 'Bearer',
        is_new_user: false,
        user: mockCurrentUser,
      });
    },
  },
  {
    method: 'POST',
    path: '/auth/phone/resend',
    handler: () => ok({ otp_token: 'mock_otp_token', expires_in: 300, resend_after: 60 }),
  },
  { method: 'POST', path: '/auth/register', handler: () => ({ status: 204, data: null }) },
  {
    method: 'POST',
    path: '/auth/login',
    handler: ({ body }) => {
      const password = (body as { password?: string } | null)?.password;
      if (password === 'wrongpassword') {
        return {
          status: 401,
          data: { code: 'invalid_credentials', message: 'Email ou mot de passe incorrect.' },
        };
      }
      return ok({
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_in: 900,
        token_type: 'Bearer',
        is_new_user: false,
        user: mockCurrentUser,
      });
    },
  },
  { method: 'POST', path: '/auth/password/forgot', handler: () => ({ status: 204, data: null }) },
  {
    method: 'POST',
    path: '/auth/refresh',
    handler: () => ok({ access_token: 'mock_access_token', refresh_token: 'mock_refresh_token' }),
  },
  { method: 'POST', path: '/auth/logout', handler: () => ({ status: 204, data: null }) },

  // --- Promos & payment --------------------------------------------
  { method: 'GET', path: '/promos/banners', handler: () => ok(mockPromoBanners) },
  { method: 'GET', path: '/payment-methods', handler: () => ok(mockPaymentMethods) },
  {
    method: 'POST',
    path: '/payment-methods',
    handler: ({ body }) => {
      const p = (body ?? {}) as { provider_token?: string; label?: string; set_default?: boolean };
      if (!p.provider_token) {
        return {
          status: 422,
          data: { code: 'VALIDATION_ERROR', message: 'provider_token requis.', field: 'provider_token' },
        };
      }
      return { status: 201, data: addMockPaymentMethod({ type: 'card', label: p.label ?? null, set_default: p.set_default }) };
    },
  },
  {
    method: 'POST',
    path: '/payment-methods/mobile',
    handler: ({ body }) => {
      const p = (body ?? {}) as { provider?: string; msisdn?: string; set_default?: boolean };
      if (!p.provider || !p.msisdn) {
        return { status: 422, data: { code: 'VALIDATION_ERROR', message: 'provider et msisdn requis.', field: 'msisdn' } };
      }
      return {
        status: 201,
        data: addMockPaymentMethod({
          type: 'mobile_money',
          provider: p.provider,
          msisdn: p.msisdn.replace(/\d(?=\d{2})/g, '•'),
          last4: p.msisdn.replace(/\D/g, '').slice(-4) || null,
          set_default: p.set_default,
        }),
      };
    },
  },
  {
    method: 'PATCH',
    path: '/payment-methods/:id',
    handler: ({ params, body }) => {
      const p = (body ?? {}) as { is_default?: boolean; label?: string };
      const updated = updateMockPaymentMethod(params.id, p);
      return updated ? ok(updated) : notFound('NOT_FOUND', 'Moyen de paiement introuvable.');
    },
  },
  {
    method: 'DELETE',
    path: '/payment-methods/:id',
    handler: ({ params }) =>
      removeMockPaymentMethod(params.id)
        ? { status: 204, data: null }
        : notFound('NOT_FOUND', 'Moyen de paiement introuvable.'),
  },

  // --- Wallet -----------------------------------------------------
  { method: 'GET', path: '/wallet', handler: () => ok(mockWallet) },
  {
    method: 'GET',
    path: '/wallet/transactions',
    handler: () => ok(page(mockWalletTransactions)),
  },
  {
    method: 'POST',
    path: '/wallet/topup',
    handler: ({ body }) => {
      const p = (body ?? {}) as { amount?: number; payment_method_id?: string };
      const amount = Math.trunc(Number(p.amount) || 0);
      if (amount < 1000) {
        return { status: 422, data: { code: 'VALIDATION_ERROR', message: 'Montant minimum 1000 millimes.', field: 'amount' } };
      }
      if (!p.payment_method_id) {
        return { status: 422, data: { code: 'VALIDATION_ERROR', message: 'payment_method_id requis.', field: 'payment_method_id' } };
      }
      return { status: 201, data: mockTopup(amount) };
    },
  },
  {
    method: 'POST',
    path: '/wallet/withdraw',
    handler: ({ body }) => {
      const p = (body ?? {}) as { amount?: number };
      const amount = Math.trunc(Number(p.amount) || 0);
      if (amount < 1000) {
        return { status: 422, data: { code: 'VALIDATION_ERROR', message: 'Montant minimum 1000 millimes.', field: 'amount' } };
      }
      const result = mockWithdraw(amount);
      return 'error' in result
        ? { status: 400, data: { code: 'WALLET_INSUFFICIENT_FUNDS', message: 'Solde insuffisant.', field: 'amount' } }
        : { status: 201, data: result };
    },
  },
  {
    method: 'POST',
    path: '/promos/validate',
    handler: ({ body }) => {
      const payload = (body ?? {}) as { code?: unknown; trip_id?: unknown; seats?: unknown };
      const code = asString(payload.code)?.toUpperCase();
      const trip = asString(payload.trip_id) ? findMockTrip(String(payload.trip_id)) : undefined;
      const seats = Math.max(1, Math.trunc(Number(payload.seats) || 1));
      if (code !== MOCK_PROMO_CODE || !trip) {
        return {
          status: 422,
          data: { code: 'promo_invalid', message: 'Code promo invalide ou expiré.', field: 'promo_code' },
        };
      }
      const base = trip.price_per_seat * seats;
      const discount = Math.round(base * MOCK_PROMO_RATE);
      return ok({
        valid: true,
        code: MOCK_PROMO_CODE,
        label: '-20 % appliqués',
        discount,
        base,
        total: base - discount,
        currency: 'TND',
      });
    },
  },

  // --- Places -----------------------------------------------------
  {
    method: 'GET',
    path: '/places/autocomplete',
    handler: ({ query }) => {
      const term = asString(query.q)?.toLowerCase() ?? '';
      return ok({
        items: mockPlaces.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            (p.governorate ?? '').toLowerCase().includes(term),
        ),
      });
    },
  },
  {
    method: 'GET',
    path: '/places/:id',
    handler: ({ params }) => {
      const place = mockPlaces.find((p) => p.id === params.id);
      return place ? ok(place) : notFound('place_not_found', 'Lieu introuvable.');
    },
  },

  // --- Trips ----------------------------------------------------
  { method: 'GET', path: '/trips/nearby', handler: () => ok(mockTripSummaries) },
  {
    method: 'POST',
    path: '/trips',
    // Minimal — see `createMockTrip` in `./fixtures.ts` for what this
    // deliberately does not model. Its purpose here is the licence check: a
    // driver whose licence is not `approved` must be rejected by the server,
    // not only stopped by the publish wizard's UI (Phase 2 / Phase 9 of the
    // driver-licence-verification handover).
    handler: ({ body }) => {
      if (mockVerifications.licence !== 'approved') {
        return {
          status: 403,
          data: {
            code: 'licence_not_approved',
            message: 'Votre permis doit être vérifié et approuvé avant de publier un trajet.',
          },
        };
      }
      const payload = (body ?? {}) as {
        vehicle_id?: string;
        origin?: { lat?: number; lng?: number; label?: string };
        destination?: { lat?: number; lng?: number; label?: string };
        departure_at?: string;
        seats?: number;
        price_per_seat?: number;
        instant_book?: boolean;
        max_two_in_back?: boolean;
        notes?: string;
      };
      return ok(createMockTrip(payload));
    },
  },
  {
    method: 'GET',
    path: '/trips/search',
    handler: ({ query }) => {
      const from = query.from_place_id;
      const to = query.to_place_id;
      const sort = query.sort;
      let matches = mockTripSummaries.filter(
        (trip) =>
          (from === undefined || placeIdMatches(trip.origin_label, from)) &&
          (to === undefined || placeIdMatches(trip.destination_label, to)),
      );
      if (sort === 'price') matches = [...matches].sort((a, b) => a.price_per_seat - b.price_per_seat);
      else if (sort === 'rating')
        matches = [...matches].sort((a, b) => b.driver.rating - a.driver.rating);
      else matches = [...matches].sort((a, b) => a.departure_at.localeCompare(b.departure_at));
      return ok(page(matches));
    },
  },
  {
    method: 'GET',
    path: '/trips/:id/seat-map',
    handler: ({ params }) => {
      const seatMap = mockSeatMaps[params.id];
      return seatMap ? ok(seatMap) : notFound('trip_not_found', 'Trajet introuvable.');
    },
  },
  {
    method: 'POST',
    path: '/trips/:id/quote',
    handler: ({ params, body }) => {
      const trip = findMockTrip(params.id);
      if (!trip) return notFound('trip_not_found', 'Trajet introuvable.');
      const payload = (body ?? {}) as { seats?: number; promo_code?: string | null };
      const seats = Math.max(1, Math.trunc(payload.seats ?? 1));
      return ok(computeFare(trip.price_per_seat, seats, payload.promo_code));
    },
  },
  {
    method: 'GET',
    path: '/trips/:id/tracking',
    handler: ({ params }) => {
      const trip = findMockTrip(params.id);
      return trip ? ok(buildMockTracking(trip.id)) : notFound('trip_not_found', 'Trajet introuvable.');
    },
  },
  {
    method: 'GET',
    path: '/trips/:id',
    handler: ({ params }) => {
      const trip = findMockTrip(params.id);
      return trip ? ok(trip) : notFound('trip_not_found', 'Trajet introuvable.');
    },
  },

  // --- Bookings -----------------------------------------------
  {
    method: 'POST',
    path: '/bookings',
    handler: ({ body }) => {
      const payload = (body ?? {}) as {
        trip_id?: string;
        seats?: number;
        seat_ids?: string[];
        promo_code?: string | null;
      };
      const trip = payload.trip_id ? findMockTrip(payload.trip_id) : undefined;
      if (!trip) return notFound('trip_not_found', 'Trajet introuvable.');
      const seats = Math.max(1, Math.trunc(payload.seats ?? 1));
      if (seats > trip.seats_available) {
        return { status: 409, data: { code: 'no_seats_left', message: 'Plus assez de places sur ce trajet.' } };
      }
      const fare = computeFare(trip.price_per_seat, seats, payload.promo_code);
      return ok(
        createMockBooking({
          trip_id: trip.id,
          seats,
          seat_ids: payload.seat_ids,
          promo_code: payload.promo_code,
          fare,
        }),
      );
    },
  },
  {
    method: 'GET',
    path: '/bookings',
    handler: ({ query }) => {
      const status = query.status;
      const now = Date.now();
      if (status === 'cancelled') {
        return ok(page(mockBookings.filter((b) => b.status.startsWith('cancelled') || b.status === 'declined')));
      }
      if (status === 'past') {
        return ok(
          page(
            mockBookings.filter(
              (b) => b.status === 'completed' || new Date(b.trip?.departure_at ?? 0).getTime() < now,
            ),
          ),
        );
      }
      return ok(
        page(
          mockBookings.filter(
            (b) =>
              ['pending', 'confirmed', 'in_progress'].includes(b.status) &&
              new Date(b.trip?.departure_at ?? 0).getTime() >= now,
          ),
        ),
      );
    },
  },
  {
    method: 'GET',
    path: '/bookings/:id',
    handler: ({ params }) => {
      const booking = mockBookings.find((b) => b.id === params.id);
      return booking ? ok(booking) : notFound('booking_not_found', 'Réservation introuvable.');
    },
  },
  {
    method: 'POST',
    path: '/bookings/:id/cancel',
    handler: ({ params }) => {
      const booking = mockBookings.find((b) => b.id === params.id);
      if (!booking) return notFound('booking_not_found', 'Réservation introuvable.');
      const hours = (new Date(booking.trip?.departure_at ?? 0).getTime() - Date.now()) / 3_600_000;
      const full = hours >= 24;
      booking.status = 'cancelled_by_rider';
      return ok({
        id: booking.id,
        status: booking.status,
        refund_amount: full ? booking.price.total : Math.round(booking.price.total * 0.5),
        refund_percent: full ? 100 : 50,
        policy: full
          ? 'Annulation gratuite : vous êtes remboursé intégralement.'
          : 'Annulation à moins de 24 h : 50 % sont retenus pour le conducteur.',
        currency: 'TND',
      });
    },
  },
  {
    method: 'POST',
    path: '/bookings/:id/share',
    handler: ({ params }) =>
      ok({
        share_url: `https://rakeb.tn/s/${params.id}`,
        expires_at: new Date(Date.now() + 24 * 3_600_000).toISOString(),
      }),
  },
  { method: 'POST', path: '/bookings/:id/review', handler: () => ({ status: 204, data: null }) },
  { method: 'POST', path: '/bookings/:id/tip', handler: () => ({ status: 204, data: null }) },

  // --- Messaging --------------------------------------------
  { method: 'GET', path: '/conversations/quick-replies', handler: () => ok(mockQuickReplies) },
  { method: 'GET', path: '/conversations', handler: () => ok(mockConversations) },
  {
    method: 'GET',
    path: '/conversations/:id/messages',
    handler: ({ params }) => ok(page(mockMessagesByConversation[params.id] ?? [])),
  },
  {
    method: 'POST',
    path: '/conversations/:id/messages',
    handler: ({ params, body }) => {
      const text = asString((body as { body?: unknown } | null)?.body);
      if (!text) return { status: 422, data: { code: 'empty_message', message: 'Message vide.', field: 'body' } };
      return ok(appendMockMessage(params.id, text));
    },
  },
  {
    method: 'POST',
    path: '/conversations/:id/read',
    handler: ({ params }) => ok(markMockConversationRead(params.id)),
  },

  // --- Reviews --------------------------------------------
  { method: 'GET', path: '/reviews/tags', handler: () => ok(mockReviewTags) },
  { method: 'GET', path: '/me/pending-reviews', handler: () => ok(mockPendingReviews) },
];

/** Mock places have `plc_*` ids; the summaries only carry labels, so match on those. */
function placeIdMatches(label: string, placeId: unknown): boolean {
  const place = mockPlaces.find((p) => p.id === placeId);
  return place ? place.name === label : false;
}
