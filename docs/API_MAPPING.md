# API mapping

Every endpoint in [`API Rakeb.md`](../API%20Rakeb.md), and the file it belongs
in. Adding one is opening a known file, not deciding where it goes.

**✅ implemented** — the function exists. **⬜ not implemented** — add it to the
listed file.

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
| ⬜  | `PATCH /me`                               |                                                                                      |
| ⬜  | `POST /me/avatar`                         | Multipart _or_ presigned via `POST /uploads/sign` — pick one first (open question 7) |
| ⬜  | `PATCH /me/role`                          | `rider \| driver \| both`                                                            |
| ⬜  | `GET · PUT /me/preferences`               |                                                                                      |
| ⬜  | `GET /me/stats`                           |                                                                                      |
| ⬜  | `GET /users/{id}`                         | Public profile                                                                       |
| ⬜  | `GET /users/{id}/reviews`                 | Paginated                                                                            |
| ⬜  | `POST /me/verifications/cin` · `/licence` | Licence gates publishing                                                             |
| ⬜  | `GET /me/verifications`                   |                                                                                      |

---

## 3. Permissions & notifications → `features/notifications/api.ts`

|     | Endpoint                              | Notes                                                           |
| --- | ------------------------------------- | --------------------------------------------------------------- |
| ⬜  | `POST /me/devices`                    | Payload from `services/notifications.buildDeviceRegistration()` |
| ⬜  | `DELETE /me/devices/{id}`             | On sign-out — TODO marked in `src/auth/session.ts`              |
| ⬜  | `GET · PUT /me/notification-settings` |                                                                 |
| ⬜  | `POST /me/location`                   | Opt-in only                                                     |

---

## 4. Lieux & recherche

### `features/carpool/places/api.ts`

|     | Endpoint                            | Notes                                                  |
| --- | ----------------------------------- | ------------------------------------------------------ |
| ⬜  | `GET /places/autocomplete?q=&near=` | Debounce; `near` from `services/location` when granted |
| ⬜  | `GET /places/{id}`                  |                                                        |

### `features/carpool/search/api.ts`

|     | Endpoint                              | Notes                                         |
| --- | ------------------------------------- | --------------------------------------------- |
| ✅  | `GET /trips/search`                   | Paginated. `filters` sent comma-joined        |
| ⬜  | `GET /trips/search/map`               | Polylines + markers; types in `services/maps` |
| ⬜  | `GET /trips/nearby?lat=&lng=`         | Home screen                                   |
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
| ⬜  | `GET /trips/price-suggestion`             | Recommended price + min/max range   |
| ⬜  | `POST /trips`                             | Whole trip in one payload           |
| ⬜  | `GET /me/trips?status=`                   | Paginated                           |
| ⬜  | `PATCH · DELETE /trips/{id}`              |                                     |
| ⬜  | `GET /me/booking-requests`                | Paginated                           |
| ⬜  | `POST /bookings/{id}/accept` · `/decline` | 24 h window                         |
| ⬜  | `POST /trips/{id}/start`                  | Validates each `passenger_code`     |
| ⬜  | `POST /trips/{id}/complete`               | Triggers payout and review requests |

---

## 8. Suivi temps réel → `features/carpool/tracking/`

|     | Endpoint                    | Notes                                                      |
| --- | --------------------------- | ---------------------------------------------------------- |
| ⬜  | `POST /trips/{id}/position` | Driver, every 5–10 s                                       |
| ⬜  | `GET /trips/{id}/tracking`  | Polling fallback — the screen must work without the socket |
| ⬜  | `WS /ws/trips/{id}`         | `services/socket` types the events already                 |

---

## 9. Messagerie → `features/carpool/conversations/`

|     | Endpoint                            | Notes                                          |
| --- | ----------------------------------- | ---------------------------------------------- |
| ⬜  | `GET /conversations`                |                                                |
| ⬜  | `GET /conversations/{id}/messages`  | Paginated, inverted list                       |
| ⬜  | `POST /conversations/{id}/messages` | Optimistic; reconcile on the socket echo by id |
| ⬜  | `POST /conversations/{id}/read`     |                                                |
| ⬜  | `GET /conversations/quick-replies`  | `STALE_TIME.static`                            |
| ⬜  | `WS /ws/conversations/{id}`         | Event names assumed — confirm first            |

---

## 10. Avis & pourboire → `features/carpool/reviews/api.ts`

|     | Endpoint                     | Notes                                             |
| --- | ---------------------------- | ------------------------------------------------- |
| ⬜  | `GET /me/pending-reviews`    |                                                   |
| ⬜  | `POST /bookings/{id}/review` | Invalidate pending reviews + the target's profile |
| ⬜  | `GET /reviews/tags`          | `STALE_TIME.static`                               |
| ⬜  | `POST /bookings/{id}/tip`    | Millimes                                          |

---

## 11. Paiement & portefeuille

### `features/payments/api.ts`

|     | Endpoint                               | Notes                                       |
| --- | -------------------------------------- | ------------------------------------------- |
| ⬜  | `GET · POST /payment-methods`          | Cards via PSP token only — never a raw PAN  |
| ⬜  | `POST /payment-methods/mobile`         | D17 / e-DINAR / Flouci                      |
| ⬜  | `PATCH · DELETE /payment-methods/{id}` |                                             |
| ⬜  | `POST /payments/intents`               | Authorize at booking, capture at acceptance |

### `features/wallet/api.ts`

|     | Endpoint                                       | Notes                 |
| --- | ---------------------------------------------- | --------------------- |
| ⬜  | `GET /wallet`                                  | `STALE_TIME.realtime` |
| ⬜  | `POST /wallet/topup` · `POST /wallet/withdraw` |                       |
| ⬜  | `GET /wallet/transactions`                     | Paginated             |

### Not a frontend concern

`POST /webhooks/psp` — server-to-server PSP callback.

---

## 12. Promos, parrainage, services

### `features/payments/api.ts`

|     | Endpoint                                     |
| --- | -------------------------------------------- |
| ⬜  | `POST /promos/validate`                      |
| ⬜  | `GET /promos/banners`                        |
| ⬜  | `GET /me/referral` · `POST /referrals/claim` |

### `features/services/api.ts`

|     | Endpoint        | Notes                                           |
| --- | --------------- | ----------------------------------------------- |
| ✅  | `GET /services` | `skipAuth`, `STALE_TIME.static`, local fallback |
| ✅  | `GET /config`   | `skipAuth`, `STALE_TIME.static`                 |

---

## 13. Aide & sécurité → `features/support/api.ts`

|     | Endpoint                         | Notes                                                                   |
| --- | -------------------------------- | ----------------------------------------------------------------------- |
| ⬜  | `GET /help/articles` · `/{slug}` |                                                                         |
| ⬜  | `POST /support/tickets`          | Attach `ApiError.requestId` when opened from a failure                  |
| ⬜  | `POST /reports`                  |                                                                         |
| ⬜  | `POST /sos`                      | Safety critical — must not be gated behind a small confirmation control |

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
