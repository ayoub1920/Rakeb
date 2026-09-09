# API mapping

Every endpoint in [`API Rakeb.md`](../API%20Rakeb.md), and the file it belongs
in. Adding one is opening a known file, not deciding where it goes.

**✅ implemented** — the function exists. **⬜ not implemented** — add it to the
listed file. **🟡 partial** — the function exists but the mock (or the real
backend) only covers part of the contract; the row says what is missing.

Conventions that apply to all of them:

- Endpoint functions go in `src/features/<feature>/api.ts` and use the helpers
  from `src/api/request.ts` (`apiGet`, `apiPost`, `apiPatch`, `apiPut`,
  `apiDelete`). They never touch `apiClient` directly.
- Hooks go in the same feature's `queries.ts`, with a key from its `keys.ts`.
- Paginated endpoints return `CursorPage<T>` and use `useInfiniteQuery` with
  `INITIAL_CURSOR` / `getNextCursor` from `src/api/pagination.ts`.
- Add a fixture to `src/api/mock/routes.ts` at the same time, or mock mode
  returns `501 not_implemented` for it.

---

## Wire shapes vs. domain model (the mapping layer)

The NestJS API's response DTOs do **not** match the domain types in
`src/types/models.ts` field-for-field: it flattens a place into
`origin_label` / `origin_lat`, names the driver `display_name`, wraps the seat
map in `{ seats, seats_available }`, returns bare arrays for
`GET /conversations`, `/reviews/tags`, `/payment-methods`, and puts the fare
under `price.total` on a booking.

Those wire shapes live in `src/types/api-responses.ts`. Each feature's `api.ts`
maps `XxxResponse` → the domain type at the boundary, so screens, queries and
components never see the wire shape. Shared trip mappers (`toTripSummary`,
`toTrip`, `toSeatMap`, `toQuote`) are in
`src/features/carpool/trips/mappers.ts` and reused by `search` and `bookings`.

Mock fixtures (`src/api/mock/fixtures.ts`) return the **wire** shapes too, so
mock mode exercises the same mapping layer as a real backend.

The passenger booking flow (search → results → trip → seat/pay → ticket →
tracking → messages → review) is wired against the real backend and marked
**implemented** in `docs/ROUTE_MAP.md`.

---

## 1. Auth & session → `features/auth/api.ts`

|     | Endpoint                                                   | Notes                                                          |
| --- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| ✅  | `POST /auth/phone/start`                                   | `skipAuth`                                                     |
| ✅  | `POST /auth/phone/verify`                                  | `skipAuth`. `is_new_user` branches to Register                 |
| ⬜  | `POST /auth/phone/resend`                                  | Rate limited: 60 s, 3 max — the UI must respect `resend_after` |
| ⬜  | `POST /auth/register`                                      |                                                                |
| ⬜  | `POST /auth/login`                                         |                                                                |
| ✅  | `POST /auth/refresh`                                       | `skipAuth` **and** `skipRefresh`                               |
| ✅  | `POST /auth/logout`                                        | Called by `endSession()`                                       |
| ⬜  | `POST /auth/password/forgot` · `POST /auth/password/reset` |                                                                |
| ⬜  | `GET /auth/email/verify?token=`                            | Deep link target                                               |

---

## 2. Profil & vérifications → `features/profile/api.ts`

|     | Endpoint                                  | Notes                                                                                |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| ✅  | `GET /me`                                 | Also the session probe                                                               |
| ✅  | `PATCH /me`                               | first/last name, birth date, e-mail, bio, locale — `/profile/edit`                    |
| ✅  | `POST /me/avatar`                         | Presigned upload (§2a, purpose `avatar`, public bucket) → `{ upload_id }`. Open question 7 resolved: the backend always uses presigned uploads, never multipart |
| ✅  | `PATCH /me/role`                          | `rider \| driver \| both`. Staff roles (`admin`, `support`) are never self-assignable — the server rejects it regardless of what the client sends |
| ✅  | `GET · PUT /me/preferences`               | chat / music / smoking / pets, each `yes \| no \| maybe` — `/profile/preferences`   |
| ⬜  | `GET /me/stats`                           |                                                                                      |
| ✅  | `GET /users/{id}`                         | `profile/user/[id].tsx` — identity, stats, badges, reviews (`usePublicProfile`)      |
| ✅  | `GET /users/{id}/reviews`                 | Infinite list on the public profile (`useUserReviews`)                               |
| ⬜  | `POST /me/verifications/cin`              |                                                                                      |
| ✅  | `POST /me/verifications/licence`          | Body `{ front_upload_id }` — upload the file first via `features/uploads/api.ts` (`POST /uploads/sign` → `PUT` → `POST /uploads/{id}/confirm`). Always resets status to `pending` — see §14 |
| ✅  | `GET /me/verifications`                   | `can_publish_trips` gates `POST /trips` (§7), enforced server-side too              |

---

### 2a. Uploads → `features/uploads/api.ts`

Shared by any feature that submits a file — the licence document today, an
avatar or a vehicle photo whenever those are wired. `uploadFile()` is the
whole three-step round trip; nothing above calls `/uploads/*` directly.

|     | Endpoint                     | Notes                                                                 |
| --- | ----------------------------- | ---------------------------------------------------------------------- |
| ✅  | `POST /uploads/sign`         | Returns a pre-signed `PUT` URL (S3/MinIO) plus `upload_id`             |
| ✅  | `POST /uploads/{id}/confirm` | Call after the `PUT` succeeds — an unconfirmed upload cannot be referenced by `POST /me/verifications/licence` (`UPLOAD_NOT_CONFIRMED`) |

---

## 3. Permissions & notifications → `features/notifications/api.ts`

|     | Endpoint                              | Notes                                                           |
| --- | ------------------------------------- | --------------------------------------------------------------- |
| ✅  | `POST /me/devices`                    | `device-registration.ts` after sign-in; OS push taps deep-link via `use-notification-response.ts` |
| ✅  | `DELETE /me/devices/{id}`             | On sign-out (`removeDeviceRegistration`)                        |
| ✅  | `GET · PUT /me/notification-settings` | `profile/notifications.tsx`                                      |
| ⬜  | `POST /me/location`                   | Opt-in only                                                     |

---

## 4. Lieux & recherche

### `features/carpool/places/api.ts`

|     | Endpoint                            | Notes                                                  |
| --- | ----------------------------------- | ------------------------------------------------------ |
| ⬜  | `GET /places/autocomplete?q=&near=` | Debounce; `near` from `services/location` when granted |
| ⬜  | `GET /places/{id}`                  |                                                        |
| ✅  | `GET /geocode/reverse?lat=&lng=`    | Pin drop → labelled `Place` (`reverseGeocode`); used by `pick-on-map`, publish only |

### `features/carpool/search/api.ts`

|     | Endpoint                              | Notes                                         |
| --- | ------------------------------------- | --------------------------------------------- |
| ✅  | `GET /trips/search`                   | Paginated. `filters` sent comma-joined        |
| ✅  | `GET /trips/search/map`               | `useTripSearchMap`; markers + decoded polylines → `services/maps`; drives the results map toggle |
| ✅  | `GET /trips/nearby?lat=&lng=`         | Home screen. Not paginated; `coords` from `services/location` after opt-in |
| ⬜  | `GET · DELETE /me/recent-searches`    |                                               |
| ⬜  | `GET · POST · DELETE /me/trip-alerts` |                                               |

---

## 5. Trajets (lecture) → `features/carpool/trips/api.ts`

|     | Endpoint                   | Notes                                                          |
| --- | -------------------------- | -------------------------------------------------------------- |
| ✅  | `GET /trips/{id}`          |                                                                |
| ⬜  | `GET /trips/{id}/seat-map` | Named positions, not a count                                   |
| ⬜  | `POST /trips/{id}/quote`   | **The** authority on totals. Never compute a price client-side |

---

## 6. Réservations → `features/carpool/bookings/api.ts`

|     | Endpoint                        | Notes                                                                          |
| --- | ------------------------------- | ------------------------------------------------------------------------------ |
| ⬜  | `POST /bookings`                | Returns `pending` _or_ `confirmed` — branch on the response, not on the button |
| ✅  | `GET /bookings?status=`         | Paginated; bucket, not raw status                                              |
| ⬜  | `GET /bookings/{id}`            | `reservation_code`, `barcode_url`, `passenger_code`                            |
| ⬜  | `GET /bookings/{id}/ticket.ics` | A download, not a query                                                        |
| ⬜  | `POST /bookings/{id}/cancel`    | The server computes the refund. Do not re-implement the 24 h rule              |
| ⬜  | `POST /bookings/{id}/share`     |                                                                                |

---

## 7. Publication & gestion

### `features/carpool/vehicles/api.ts`

|     | Endpoint                                   |
| --- | ------------------------------------------ |
| ⬜  | `GET · POST · PATCH · DELETE /me/vehicles` |

### `features/carpool/publishing/api.ts`

|     | Endpoint                                  | Notes                               |
| --- | ----------------------------------------- | ----------------------------------- |
| ✅  | `GET /trips/price-suggestion`             | Recommended price + min/max range   |
| ✅  | `POST /trips`                             | Whole trip in one payload. `publish:false` keeps a draft. The real backend enforces the licence gate (`VERIFICATION_REQUIRED`, §14). Mock mode only checks `can_publish_trips` and echoes a minimal trip back |
| ✅  | `POST /trips/{id}/publish`                | Promotes a `draft` → `published`, schedules the reminders (`publishTripDraft`) |
| ✅  | `GET /me/trips?status=`                   | `trips/mine.tsx`, every bucket tappable → `/carpool/requests/{id}` |
| ✅  | `PATCH /trips/{id}`                       | `useUpdateTrip` (wired; no dedicated edit screen yet) |
| ✅  | `DELETE /trips/{id}`                      | Driver "Annuler le trajet" on `requests/[tripId].tsx` (`useCancelTrip`) |
| ✅  | `GET /me/booking-requests?trip_id=&status=` | Fetched for both `pending` and `confirmed`/`in_progress` to build the roster |
| ✅  | `POST /bookings/{id}/accept` · `/decline` | Per-request on `requests/[tripId].tsx` |
| ✅  | `POST /bookings/{id}/no-show`             | Driver marks a passenger absent while `in_progress` (`markNoShow`) |
| ✅  | `POST /trips/{id}/start`                  | Called with no body = "Démarrer le covoiturage"; with `passenger_code` = check-in. Server rejects earlier than `trip.start_window_minutes` before departure (`TRIP_TOO_EARLY_TO_START`) |
| ✅  | `POST /trips/{id}/complete`               | Triggers payout and review requests; also sends `trip_completed` |

---

## 8. Suivi temps réel → `features/carpool/tracking/`

|     | Endpoint                    | Notes                                                      |
| --- | --------------------------- | ---------------------------------------------------------- |
| ✅  | `POST /trips/{id}/position` | `use-driver-position-broadcast.ts` — foreground watch (~8 s / 40 m) while the driver's trip is `in_progress`; also emits `driver:position` on `/ws/trips`. 409 `TRACKING_TRIP_NOT_ACTIVE` otherwise |
| ✅  | `GET /trips/{id}/tracking`  | Polling fallback — the screen must work without the socket. 4-step timeline (`Prévu → Démarré → En route → Arrivé`) |
| ✅  | `WS /ws/trips/{id}`         | `use-trip-live-updates.ts` — folds `position`/`eta_updated`/`trip_started`/`trip_completed` into the tracking cache; poll stays source of truth |

---

## 9. Messagerie → `features/carpool/conversations/`

|     | Endpoint                            | Notes                                          |
| --- | ----------------------------------- | ---------------------------------------------- |
| ⬜  | `GET /conversations`                |                                                |
| ⬜  | `GET /conversations/{id}/messages`  | Paginated, inverted list                       |
| ⬜  | `POST /conversations/{id}/messages` | Optimistic; reconcile on the socket echo by id |
| ✅  | `POST /conversations/{id}/read`     | Called on thread open + on each new message; clears the unread badge |
| ⬜  | `GET /conversations/quick-replies`  | `STALE_TIME.static`                            |
| ✅  | `WS /ws/conversations`              | Socket.IO namespace. `useConversationLiveUpdates` — live `message` + `typing`, deduped into the messages cache. `services/socket` is namespace-aware; polling stays on as a fallback |

---

## 10. Avis & pourboire → `features/carpool/reviews/api.ts`

|     | Endpoint                     | Notes                                             |
| --- | ---------------------------- | ------------------------------------------------- |
| ✅  | `GET /me/pending-reviews`    | "Trajets à noter" banner on `(tabs)/activity.tsx`  |
| ⬜  | `POST /bookings/{id}/review` | Invalidate pending reviews + the target's profile |
| ⬜  | `GET /reviews/tags`          | `STALE_TIME.static`                               |
| ⬜  | `POST /bookings/{id}/tip`    | Millimes                                          |

---

## 11. Paiement & portefeuille

### `features/payments/api.ts`

|     | Endpoint                               | Notes                                       |
| --- | -------------------------------------- | ------------------------------------------- |
| ✅  | `GET · POST /payment-methods`          | Cards via PSP token only — never a raw PAN  |
| ✅  | `POST /payment-methods/mobile`         | D17 / e-DINAR / Flouci. Wire `type` is `mobile_money` |
| ✅  | `PATCH · DELETE /payment-methods/{id}` | Set default / rename / remove — `/profile/payment-methods` |
| ⬜  | `POST /payments/intents`               | Authorize at booking, capture at acceptance |

### `features/wallet/api.ts`

|     | Endpoint                                       | Notes                 |
| --- | ---------------------------------------------- | --------------------- |
| ✅  | `GET /wallet`                                  | `STALE_TIME.realtime`. `WalletController` in `rakeb-backend`'s `wallet.module.ts` |
| ✅  | `POST /wallet/topup` · `POST /wallet/withdraw` | Both `@Idempotent()` — fresh `Idempotency-Key` per attempt |
| ✅  | `GET /wallet/transactions`                     | Paginated. `features/wallet`  |

### Not a frontend concern

`POST /webhooks/psp` — server-to-server PSP callback.

---

## 12. Promos, parrainage, services

### `features/payments/api.ts`

|     | Endpoint                                     | Notes                                             |
| --- | -------------------------------------------- | ------------------------------------------------- |
| ⬜  | `POST /promos/validate`                      | The authority on a discount; never compute one client-side |
| ✅  | `GET /promos/banners`                        | Home-screen strip. `STALE_TIME.static`; empty list hides the section |
| ⬜  | `GET /me/referral` · `POST /referrals/claim` |                                                  |

### `features/services/api.ts`

|     | Endpoint        | Notes                                           |
| --- | --------------- | ----------------------------------------------- |
| ✅  | `GET /services` | `skipAuth`, `STALE_TIME.static`, local fallback |
| ✅  | `GET /config`   | `skipAuth`, `STALE_TIME.static`                 |

---

## 13. Aide & sécurité → `features/support/api.ts`

|     | Endpoint                         | Notes                                                                   |
| --- | -------------------------------- | ----------------------------------------------------------------------- |
| ✅  | `GET /help/articles` · `/{slug}` | `support/index.tsx` list + `support/article/[slug].tsx` (`features/support`)              |
| ✅  | `POST /support/tickets`          | `support/ticket.tsx` — subject/category/message; carries `request_id` param            |
| ✅  | `POST /reports`                  | `support/report.tsx` — reason chips + details; opened with `target_type`/`target_id`   |
| ⬜  | `POST /sos`                      | Safety critical — must not be gated behind a small confirmation control |

---

## 14. Administration → `features/admin/licences/api.ts`

Not in `API Rakeb.md` — implemented in `rakeb-backend`'s
`src/modules/admin/admin-verifications.controller.ts`. The endpoint also
serves `cin` rows; this app only surfaces `licence` (`type=licence` pinned in
every call). Every endpoint requires the `admin` or `support` role, enforced
by `RolesGuard` server-side — the mock (`src/api/mock/routes.ts`) returns the
same `403` for anyone else.

|     | Endpoint                                                | Notes                                    |
| --- | -------------------------------------------------------- | ----------------------------------------- |
| ✅  | `GET /admin/verifications?type=licence&status=&cursor=`  | Real cursor pagination (`{ items, next_cursor, has_more, total }`) |
| ✅  | `GET /admin/verifications/{userId}/licence`               | Includes `front_upload_url` — a short-lived signed download URL |
| ✅  | `POST /admin/verifications/{userId}/licence/review`       | Body `{ status: 'approved' \| 'rejected', reason? }`. Flips `GET /me/verifications` for that user |

### 14a. User directory → `features/admin/users/api.ts`

`rakeb-backend`'s `admin-users.controller.ts`. `search`/`detail` accept
`admin` **or** `support`; `status`/`role` changes are `admin`-only. The
backend refuses an admin acting on their **own** account (`400 BAD_REQUEST`)
— the detail screen hides those actions for that case.

|     | Endpoint                              | Notes                                                  |
| --- | ------------------------------------- | ------------------------------------------------------ |
| ✅  | `GET /admin/users?q=&role=&status=&cursor=` | Matches phone / e-mail / first / last name. Cursor pagination |
| ✅  | `GET /admin/users/{id}`               | Profile, verification statuses (`cin`/`licence`), trip counts, last seen |
| ✅  | `PATCH /admin/users/{id}/status`      | Body `{ status: 'active' \| 'suspended' \| 'deleted', reason? }`. `suspended`/`deleted` both block login; neither erases data |
| ✅  | `PATCH /admin/users/{id}/role`        | Body `{ role }` — any role, incl. `admin`/`support` |

---

## Scheduled jobs — nothing to implement

Expiring requests at 24 h, departure reminders, payment capture, driver payouts,
automatic refunds, rating recalculation, GPS purge. Backend cron. The frontend
only observes the results, which means a booking's status can change without any
user action — hence `refetchOnMount: 'always'` on the bookings list.

---

## Replacing these types

`src/types/models.ts` is hand-written from the endpoint table and covers only
what the eight implemented functions touch. It is temporary.

Generate the real ones from the NestJS OpenAPI document:

```bash
npx openapi-typescript http://localhost:3000/v1/openapi.json -o src/types/api-generated.ts
```

Then replace imports from `@/types/models` with the generated equivalents and
delete `models.ts` — do not grow it. The client keeps the backend's `snake_case`
field names end to end precisely so that swap needs no mapping layer.

Confirm the open questions in
[`API_FRONTEND_ANALYSIS.md`](./API_FRONTEND_ANALYSIS.md) §8 first — in
particular the cursor page envelope, which every paginated hook assumes.
