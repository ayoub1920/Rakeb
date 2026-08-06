# API → Frontend analysis

Source of truth: [`API Rakeb.md`](../API%20Rakeb.md) — REST v1, carpool only.

This document is the reading of the backend contract that the frontend scaffold was built
from. It exists so that the next developer does not have to re-derive feature boundaries,
route names, or caching rules from the endpoint table.

It is an **analysis**, not an implementation checklist. The concrete endpoint-by-endpoint
placement table lives in [`API_MAPPING.md`](./API_MAPPING.md).

---

## 1. Contract-level conventions

These five conventions shape the whole client. They are implemented once, in
`src/api`, and every feature inherits them.

| Convention | Backend rule                                   | Where the frontend implements it                                                          |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Base URL   | `https://api.rakeb.tn/v1`                      | `src/config/env.ts` (`EXPO_PUBLIC_API_URL`) + `API_PREFIX = '/v1'` in `src/api/client.ts` |
| Auth       | `Authorization: Bearer <access_token>`         | Request interceptor in `src/api/client.ts`, token read from `src/auth/token-storage.ts`   |
| Money      | integers in **millimes** (`15800` = 15,800 DT) | `src/utils/money.ts` — never a float in the client                                        |
| Pagination | cursor: `?cursor=&limit=20`                    | `CursorPage<T>` / `CursorParams` in `src/types/api.ts`, consumed by `useInfiniteQuery`    |
| Errors     | `{ code, message, field? }`                    | Normalized to `ApiError` in `src/api/errors.ts`                                           |

### 1.1 Money

Every amount in the API is an integer number of millimes. The frontend must never
divide before display and must never do arithmetic on prices — `POST /trips/{id}/quote`
and `POST /promos/validate` are the authorities for totals and discounts. The client
only formats: `formatMillimes(15800) === '15,800 DT'`.

### 1.2 Errors

`{ code, message, field? }` maps cleanly onto React Hook Form: `code` drives the
branch (toast vs. retry vs. re-auth), `message` is already localizable server text, and
`field` lets a mutation push the error onto the right input via `setError(field, …)`.
The client adds two fields the backend does not send — `status` (HTTP status) and
`requestId` (echoed correlation header) — because both are needed for support tickets
and for deciding whether a failure is retryable.

### 1.3 Pagination

Cursor pagination appears on: `/users/{id}/reviews`, `/trips/search`, `/bookings`,
`/me/trips`, `/me/booking-requests`, `/conversations/{id}/messages`,
`/wallet/transactions`. All of them get `useInfiniteQuery` with
`getNextPageParam: (page) => page.next_cursor ?? undefined`. No offset pagination
anywhere, so there is no page-number state to keep.

### 1.4 Two transports

The API is REST + WebSocket, and the split is explicit: `/ws/trips/{id}` and
`/ws/conversations/{id}`. This is why `src/services/socket` exists as a separate,
typed service rather than as something bolted onto the Axios layer. The documented
fallback (`GET /trips/{id}/tracking`, "fallback polling") means tracking must work
with sockets _disabled_ — so the socket layer is an enhancement over query data,
never the only source of truth.

---

## 2. Feature boundaries derived from the API

The API's twelve sections do not map 1:1 onto frontend features. The mapping below is
the one the scaffold uses (`src/features/*`), and the reasons for each divergence.

| API section                      | Frontend feature                                            | Note                                                                               |
| -------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1. Auth & session                | `features/auth`                                             | Phone-first, email/password secondary                                              |
| 2. Profil & vérifications        | `features/profile`                                          | `GET /users/{id}` is a _public_ profile — same feature, different query            |
| 3. Permissions & notifications   | `features/notifications`                                    | Device registration belongs with push, not with profile                            |
| 4. Lieux & recherche             | `features/carpool/places` + `features/carpool/search`       | Split: autocomplete is reusable by publishing, search is not                       |
| 5. Trajets (lecture)             | `features/carpool/trips`                                    | Read model shared by passenger and driver                                          |
| 6. Réservations                  | `features/carpool/bookings`                                 | Passenger side                                                                     |
| 7. Publication & gestion         | `features/carpool/publishing` + `features/carpool/vehicles` | Split: vehicles are managed outside the publish wizard too                         |
| 8. Suivi temps réel              | `features/carpool/tracking`                                 | REST + WS                                                                          |
| 9. Messagerie                    | `features/carpool/conversations`                            | REST + WS                                                                          |
| 10. Avis & pourboire             | `features/carpool/reviews`                                  | Tip is a payment action but a review-flow screen                                   |
| 11. Paiement & portefeuille      | `features/payments` + `features/wallet`                     | Split: payment methods are used during booking, wallet is a standalone destination |
| 12. Promos, parrainage, services | `features/services` (+ promos inside `features/payments`)   | `GET /services` and `GET /config` are app-level bootstrap                          |
| 13. Aide & sécurité              | `features/support`                                          | Help, tickets, reports, SOS                                                        |

Three boundary decisions worth recording:

1. **`places` is separate from `search`.** `GET /places/autocomplete` is consumed by
   the passenger search form _and_ by the driver route step of the publish wizard. If
   it lived in `search`, `publishing` would import from a sibling feature.
2. **`payments` is separate from `wallet`.** They share `/wallet/topup` at the edges,
   but payment methods are a booking-time concern while the wallet is a destination
   screen with its own transaction list.
3. **`services` is a feature, not config.** `GET /services` returns a catalogue with
   `status: "live" | "coming_soon"`. That is product data with UI attached (the
   coming-soon modal), so it gets a feature. `GET /config` (feature flags, currency,
   min/max price, minimum app version) is app-level bootstrap and stays in
   `features/services/api` next to it because both are fetched at startup.

---

## 3. Bootstrap sequence

The API implies a specific startup order, which the provider tree in
`src/providers/AppProviders.tsx` reflects:

```
SecureStore read (access + refresh token)
        ↓
AuthProvider → status: 'loading' | 'authenticated' | 'unauthenticated'
        ↓
GET /config      (feature flags, min app version)   ← may run unauthenticated
GET /services    (catalogue)                        ← may run unauthenticated
        ↓
GET /me          (only when authenticated)
        ↓
Router redirect: (auth) group vs. (tabs) group
```

`GET /config` and `GET /services` do not require a token, so the home screen can render
the service catalogue before login. `GET /me` is the authenticated-session probe: a
401 on it is what invalidates a restored session.

---

## 4. Token lifecycle

The API gives us `access_token` + `refresh_token` from `/auth/phone/verify` (and
`/auth/login`), `POST /auth/refresh` for renewal, and `POST /auth/logout` to revoke.
The scaffold encodes this as:

- Both tokens live in **Expo SecureStore only** (`src/auth/token-storage.ts`). Never
  AsyncStorage — a refresh token in AsyncStorage is plaintext on a rooted device.
- A single response interceptor catches `401`, calls `/auth/refresh` **once**, queues
  concurrent failures behind that single refresh, then replays them
  (`src/api/refresh.ts`). Without the queue, a screen firing four parallel queries
  would burn four refresh tokens.
- Refresh failure → `signOut()` → SecureStore cleared → router redirects to `(auth)`.
- `POST /auth/logout` is fired on sign-out, and `DELETE /me/devices/{id}` should be
  fired alongside it (documented as a TODO in `src/auth/AuthProvider.tsx`), because
  the API explicitly ties device deletion to logout.

`is_new_user` on `/auth/phone/verify` is the branch that decides OTP → Register vs.
OTP → Home. It is why the register route is _inside_ the `(auth)` group rather than
being a first-run screen.

---

## 5. Cache strategy per data class

TanStack Query defaults are wrong for at least three of these classes, so the scaffold
records the intended `staleTime` per class rather than tuning them one screen at a time.

| Data class       | Endpoints                                                               | Staleness                | Why                                    |
| ---------------- | ----------------------------------------------------------------------- | ------------------------ | -------------------------------------- |
| Static catalogue | `/services`, `/config`, `/reviews/tags`, `/conversations/quick-replies` | long (hours)             | Changes on deploy, not per session     |
| Session          | `/me`, `/me/preferences`, `/me/verifications`                           | medium                   | Changes only via user's own mutations  |
| Search results   | `/trips/search`, `/trips/nearby`                                        | short                    | Seat availability moves under the user |
| Live             | `/trips/{id}/tracking`, messages                                        | none                     | Socket-driven; query is the fallback   |
| Money            | `/wallet`, `/payment-methods`                                           | short + refetch on focus | Must not show a stale balance          |

Search results deserve emphasis: `/trips/search` results contain `places restantes`,
which another user can consume at any moment. The booking mutation must therefore treat
"no seats left" as an expected error path, not an exceptional one.

---

## 6. What the API tells us about the UI that the scaffold reserves space for

- **Seat map.** `GET /trips/{id}/seat-map` returns named positions
  (`front | rear_left | rear_middle | rear_right`), not a seat count. The booking flow
  therefore needs a car-diagram picker, and `max_two_in_back` from `POST /trips`
  constrains it. The scaffold reserves `carpool/booking/[id]` but does not model seats.
- **Passenger code.** `GET /bookings/{id}` returns `reservation_code`, `barcode_url`
  and a 4-digit `passenger_code`, and `POST /trips/{id}/start` consumes that code. This
  is a two-sided boarding flow (passenger shows, driver types) — it needs both screens
  live before either is testable.
- **Publish wizard.** `POST /trips` takes `vehicle_id, origin, stops[], destination,
departure_at, seats, price_per_seat, instant_book, max_two_in_back, recurrence?` in
  one payload. The six scaffold routes (route → schedule → vehicle → seats → price →
  review) are steps over a _single_ draft object, which is why publishing will need a
  Zustand draft store rather than six independent forms. That store is not in the
  scaffold — see `features/carpool/publishing/README.md`.
- **Price suggestion.** `GET /trips/price-suggestion` returns a recommended price plus
  a min/max range — a slider with an anchor, not a free number input. The frontend must
  not compute the suggestion itself.
- **Cancellation refunds.** `POST /bookings/{id}/cancel` computes the refund
  ("gratuit > 24 h, 50 % après"). The client displays the policy text and the returned
  amount; it must not re-implement the 24 h rule, or the two will drift.
- **Instant book.** `POST /bookings` returns `pending` _or_ `confirmed` depending on the
  trip's `instant_book` flag. The success screen is therefore conditional on the
  response, not on what the user tapped.

---

## 7. Endpoints deliberately not scaffolded

The task asked for a handful of example API functions. These are implemented:
`getServices`, `getAppConfig`, `getCurrentUser`, `startPhoneAuth`, `verifyPhoneOtp`,
`searchTrips`, `getTrip`, `getBookings`.

Everything else in `API Rakeb.md` is intentionally absent. `API_MAPPING.md` lists every
remaining endpoint with the exact file it belongs in, so adding one is a matter of
opening a known file rather than deciding where it goes.

Two endpoints are explicitly **not** frontend concerns:

- `POST /webhooks/psp` — server-to-server PSP callback.
- Scheduled jobs (expiration, reminders, capture, payouts, rating recalculation, GPS
  purge) — backend cron. The frontend only observes their effects.

---

## 8. Open questions for the backend

These block real screens, not the scaffold. Recorded here so they are asked once.

1. **Cursor page envelope.** The doc specifies `?cursor=&limit=` for requests but not
   the response shape. The scaffold assumes
   `{ items: T[], next_cursor: string | null, total?: number }`. `/trips/search` is
   documented as returning "liste + `total`", which fits, but this must be confirmed.
2. **Field naming.** The doc uses `snake_case` (`otp_token`, `price_per_seat`,
   `is_new_user`). The scaffold keeps `snake_case` end-to-end rather than mapping to
   camelCase, so that generated OpenAPI types can drop in unchanged.
3. **Socket auth.** No handshake auth is documented for `/ws/trips/{id}`. The scaffold
   sends the access token via `auth: { token }` in the Socket.IO handshake, which is
   the Socket.IO convention, and must be confirmed against the Nest gateway.
4. **Socket event names.** `position`, `eta_updated`, `trip_started`, `trip_completed`
   are documented for trips. Conversation events ("messages en direct + indicateur de
   frappe") are not named. The scaffold guesses `message`, `typing`, `read`.
5. **`GET /config` shape.** Only described as "feature flags, devise, min/max prix,
   version mini de l'app". The scaffold types it loosely
   (`feature_flags: Record<string, boolean>`) until the real shape is known.
6. **Minimum app version.** `GET /config` returns it, but no behaviour is specified.
   Assumption: it drives a blocking update screen. Not scaffolded.
7. **Upload flow.** `POST /me/avatar` is "multipart ou URL pré-signée via
   `POST /uploads/sign`". Picking one matters for the client — the scaffold implements
   neither and leaves `features/profile` free of upload code.

---

## 9. Multi-service future

`GET /services` returns a catalogue where only `carpool` is `live`; `taxi`, `food` and
`grocery` are `coming_soon`. The scaffold treats this as the extension point for the
whole product:

- The catalogue is data, not code. A new service going live is a backend change plus a
  new `src/features/<service>` folder and a new `src/app/<service>` route group.
- `src/features/services/service-registry.ts` maps a service `id` to its entry route.
  A `coming_soon` service has no entry route and opens the coming-soon modal instead.
- Nothing in `features/carpool` is imported by shared code, so `taxi` can be added
  without touching it.

See "How future taxi or food services should be added" in
[`FRONTEND_ARCHITECTURE.md`](./FRONTEND_ARCHITECTURE.md).
