# Route map

Every route in the scaffold, its file, and the feature that will own its logic.

Expo Router uses `src/app` as the root. Segments in parentheses are **groups**:
they share a layout but do not appear in the URL.

Status legend: **placeholder** = renders `DevelopmentPlaceholder`;
**partial** = some real behaviour is wired.

---

## Root

| File             | Purpose                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| `_layout.tsx`    | Mounts `AppProviders`, the auth guard, and the root `Stack`. Holds the navigator back while the session is restoring. |
| `+not-found.tsx` | Unmatched URL.                                                                                                        |

---

## `(auth)` — authentication

Native header hidden across the group; screens use `ScreenHeader`. The guard
sends any signed-out user here.

| Route                     | File                         | Title                | Feature | Endpoints                                                 | Status      |
| ------------------------- | ---------------------------- | -------------------- | ------- | --------------------------------------------------------- | ----------- |
| `/(auth)/welcome`         | `(auth)/welcome.tsx`         | Bienvenue sur Rakeb  | `auth`  | —                                                         | placeholder |
| `/(auth)/phone`           | `(auth)/phone.tsx`           | Numéro de téléphone  | `auth`  | `POST /auth/phone/start`                                  | placeholder |
| `/(auth)/otp`             | `(auth)/otp.tsx`             | Code de vérification | `auth`  | `POST /auth/phone/verify`, `POST /auth/phone/resend`      | **implemented** |
| `/(auth)/register`        | `(auth)/register.tsx`        | Créer votre compte   | `auth`  | `POST /auth/register`                                     | **partial** — `POST /referrals/claim` not wired (no referral field in the design) |
| `/(auth)/login`           | `(auth)/login.tsx`           | Connexion            | `auth`  | `POST /auth/login`                                        | **implemented** |
| `/(auth)/forgot-password` | `(auth)/forgot-password.tsx` | Mot de passe oublié  | `auth`  | `POST /auth/password/forgot`                               | **partial** — `POST /auth/password/reset` belongs to the emailed-link deep link, not this screen |

Route params: `otp` takes `otp_token`, `phone` and `resend_after`. The
`otp_token` is passed as a route param rather than stored — it is single-use
and short-lived.

---

## `(tabs)` — the five tabs

Tab labels are translated (`tabs.*` keys). Each tab renders `ScreenHeader`
because tab roots have no back button.

| Route       | File                  | Tab      | Feature                 | Endpoints                                  | Status                          |
| ----------- | --------------------- | -------- | ----------------------- | ------------------------------------------ | ------------------------------- |
| `/`         | `(tabs)/index.tsx`    | Accueil  | `carpool/search`        | `GET /trips/nearby`, `GET /promos/banners`, `GET /services` | **implemented** — nearby trips gated behind an in-screen location prompt |
| `/services` | `(tabs)/services.tsx` | Services | `services`              | `GET /services`                            | **partial** — real catalogue    |
| `/activity` | `(tabs)/activity.tsx` | Activité | `carpool/bookings`      | `GET /bookings?status=`                    | **implemented** — upcoming / past / cancelled tabs, infinite list |
| `/messages` | `(tabs)/messages.tsx` | Messages | `carpool/conversations` | `GET /conversations`                       | **implemented** — conversation list with unread badges; a thread opens from the booking ticket ("Contacter le conducteur"), marks itself read (`POST /conversations/{id}/read`), and streams the driver's replies + typing live over `WS /ws/conversations` (polling fallback when the socket is down) |
| `/account`  | `(tabs)/account.tsx`  | Compte   | `profile`               | `GET /me`                                  | **implemented** — profile header, menu, admin console (staff), sign-out |

---

## `carpool` — passenger

| Route                         | File                             | Title                | Feature                 | Endpoints                                       | Status                         |
| ----------------------------- | -------------------------------- | -------------------- | ----------------------- | ----------------------------------------------- | ------------------------------ |
| `/carpool/search`             | `carpool/search.tsx`             | Chercher un trajet   | `carpool/search`        | reads the search store; opens the place modal   | **implemented** — origin/destination, day chips, seat stepper |
| `/carpool/results`            | `carpool/results.tsx`            | Résultats            | `carpool/search`        | `GET /trips/search`                             | **implemented** — infinite list, sort + filter chips, map toggle |
| `/carpool/trip/[id]`          | `carpool/trip/[id].tsx`          | Détail du trajet     | `carpool/trips`         | `GET /trips/{id}`                               | **implemented** — itinerary, driver, vehicle, policy |
| `/carpool/book/[tripId]`      | `carpool/book/[tripId].tsx`      | Votre place          | `carpool/trips`, `carpool/bookings`, `payments` | `GET /trips/{id}/seat-map`, `POST /trips/{id}/quote`, `GET /payment-methods`, `POST /promos/validate`, `POST /bookings` | **implemented** — seat map, fare, promo, payment method |
| `/carpool/booking/[id]`       | `carpool/booking/[id].tsx`       | Votre réservation    | `carpool/bookings`      | `GET /bookings/{id}`, `/cancel`, `/share`       | **implemented** — reservation + passenger code, share, cancel |
| `/carpool/tracking/[tripId]`  | `carpool/tracking/[tripId].tsx`  | Suivi en direct      | `carpool/tracking`      | `GET /trips/{id}/tracking` (polled); `WS /ws/trips/{id}` is a follow-up | **implemented** — `MapPlaceholder`, driver, ETA, passenger code |
| `/carpool/conversation/[id]`  | `carpool/conversation/[id].tsx`  | Conversation         | `carpool/conversations` | `GET · POST /conversations/{id}/messages`, `GET /conversations/quick-replies` | **implemented** — inverted thread, optimistic send, quick replies |
| `/carpool/review/[bookingId]` | `carpool/review/[bookingId].tsx` | Votre avis           | `carpool/reviews`       | `GET /reviews/tags`, `POST /bookings/{id}/review`, `/tip` | **implemented** — stars, compliment tags, comment, tip |

Activité (the bookings list) is the `(tabs)/activity` route above, not a
separate carpool route.

---

## `carpool/publish` — driver wizard

Six steps over **one** draft trip (`stores/publish-draft-store`), because
`POST /trips` takes the whole thing in a single payload. `review` is the only
step that writes; it clears the draft on success.

| Route                       | File                   | Title               | Endpoints                     | Status |
| --------------------------- | ---------------------- | ------------------- | ----------------------------- | ------ |
| `/carpool/publish`          | `publish/index.tsx`    | Publier un trajet   | `GET /me/verifications`, `PATCH /me/role` | **implemented** — licence gate + role opt-in |
| `/carpool/publish/route`    | `publish/route.tsx`    | Itinéraire          | place modal (`target=publish`) | **implemented** — origin, stops, destination |
| `/carpool/publish/schedule` | `publish/schedule.tsx` | Date et heure       | —                             | **implemented** — day + time chips, weekly recurrence |
| `/carpool/publish/vehicle`  | `publish/vehicle.tsx`  | Véhicule            | `GET /me/vehicles`            | **implemented** — pick or add |
| `/carpool/publish/seats`    | `publish/seats.tsx`    | Places              | —                             | **implemented** — seats, instant-book, max-two-in-back |
| `/carpool/publish/price`    | `publish/price.tsx`    | Prix                | `GET /trips/price-suggestion` | **implemented** — stepper clamped to min/max, anchored on suggestion |
| `/carpool/publish/review`   | `publish/review.tsx`   | Vérifier et publier | `POST /trips`                 | **implemented** — recap + notes → publish |

Feature: `carpool/publishing`.

---

## `carpool/trips/mine` & `carpool/requests` — manage published trips

| Route                        | File                          | Title    | Endpoints                                                                 | Status |
| ---------------------------- | ----------------------------- | -------- | ----------------------------------------------------------------------- | ------ |
| `/carpool/trips/mine`        | `carpool/trips/mine.tsx`      | Mes trajets | `GET /me/trips?status=`                                              | **implemented** — à venir / confirmés / terminés / annulés |
| `/carpool/requests/[tripId]` | `carpool/requests/[tripId].tsx` | Mon trajet | `GET /me/booking-requests` (`pending` + roster), `POST /bookings/{id}/accept` · `/decline` · `/no-show`, `POST /trips/{id}/start` · `/complete`, `DELETE /trips/{id}` | **implemented** — status badge, accept/refuse, **"Démarrer le covoiturage"** (codeless start), confirmed-passenger roster + code check-in + no-show, complete, cancel. Broadcasts the driver's GPS (`use-driver-position-broadcast`) while `in_progress` |

---

## `carpool/vehicles` — driver vehicles

| Route                    | File                 | Title               | Endpoints                          | Status |
| ------------------------ | -------------------- | ------------------- | ---------------------------------- | ------ |
| `/carpool/vehicles`      | `vehicles/index.tsx` | Mes véhicules       | `GET /me/vehicles`                 | **implemented** |
| `/carpool/vehicles/new`  | `vehicles/new.tsx`   | Ajouter un véhicule | `POST /me/vehicles`                | **implemented** — RHF + Zod, Tunisian plate |
| `/carpool/vehicles/[id]` | `vehicles/[id].tsx`  | Véhicule            | `PATCH · DELETE /me/vehicles/{id}` | **implemented** — edit, set default, delete |

Feature: `carpool/vehicles`.

---

## `profile`

| Route                      | File                          | Title                 | Feature         | Endpoints                                                         | Status |
| -------------------------- | ----------------------------- | --------------------- | --------------- | ----------------------------------------------------------------- | ------ |
| `/profile/edit`            | `profile/edit.tsx`            | Modifier mon profil   | `profile`       | `PATCH /me`, `POST /me/avatar`, `PATCH /me/role`                  | **implemented** — RHF + Zod form, avatar picker → presigned upload, role segmented control |
| `/profile/preferences`     | `profile/preferences.tsx`     | Préférences de voyage | `profile`       | `GET · PUT /me/preferences`                                       | **implemented** — chat / music / smoking / pets, 3-way toggle |
| `/profile/verifications`   | `profile/verifications.tsx`   | Vérifications         | `profile`       | `GET /me/verifications`, `POST /me/verifications/licence`         | **implemented**. `POST /me/verifications/cin` still ⬜ |
| `/profile/notifications`   | `profile/notifications.tsx`   | Notifications         | `notifications` | `GET · PUT /me/notification-settings`, device sync               | **implemented** — per-event toggles + channels; OS push taps deep-link (`use-notification-response.ts`) |
| `/profile/payment-methods` | `profile/payment-methods.tsx` | Moyens de paiement    | `payments`      | `GET · POST · PATCH · DELETE /payment-methods`, `POST /payment-methods/mobile` | **implemented** — list, add card (PSP token), add mobile money, set default, delete |
| `/profile/wallet`          | `profile/wallet.tsx`          | Portefeuille          | `wallet`        | `GET /wallet`, `GET /wallet/transactions`, `POST /wallet/topup`, `POST /wallet/withdraw` | **implemented** — balance card, top-up, withdraw, infinite ledger |
| `/profile/user/[id]`       | `profile/user/[id].tsx`       | Profil                | `profile`       | `GET /users/{id}`, `/reviews`                                     | **implemented** — identity, stats, badges, reviews list, report link |

---

## `support`

| Route                     | File                         | Title                | Endpoints                     | Status |
| ------------------------- | ---------------------------- | -------------------- | ----------------------------- | ------ |
| `/support`                | `support/index.tsx`          | Aide & sécurité      | `GET /help/articles`          | **implemented** — article list + entry points |
| `/support/article/[slug]` | `support/article/[slug].tsx` | Article              | `GET /help/articles/{slug}`   | **implemented** |
| `/support/ticket`         | `support/ticket.tsx`         | Contacter le support | `POST /support/tickets`       | **implemented** — subject/category/message; takes `request_id` |
| `/support/report`         | `support/report.tsx`         | Signaler             | `POST /reports`               | **implemented** — reason + details; takes `target_type` / `target_id` |

Feature: `src/features/support` (`api.ts`, `queries.ts`, `keys.ts`).

---

## `(modals)`

`presentation: 'modal'` is set once on the group layout.

| Route                    | File                        | Purpose                                                                      | Status          |
| ------------------------ | --------------------------- | ---------------------------------------------------------------------------- | --------------- |
| `/(modals)/coming-soon`  | `(modals)/coming-soon.tsx`  | Shown when a `coming_soon` service is tapped. Takes `serviceName`.           | **implemented** |
| `/(modals)/select-place` | `(modals)/select-place.tsx` | Place picker, opened from search and from the publish wizard. Takes `field`. | **implemented** — debounced `GET /places/autocomplete`, writes the search store |

---

## `admin` — admin console

Gated by `role === 'admin' | 'support'` in `admin/_layout.tsx`, which redirects
to `/(tabs)` for anyone else — UX only, not the security boundary; every
endpoint these screens call re-checks the role server-side
(`docs/API_MAPPING.md` §14). Reachable from Compte → "Console admin", shown
only when `useIsAdmin()` is true. Mutating actions in the Users section
(`useIsFullAdmin()`) are `admin`-only — a `support` viewer sees the directory
read-only. There is no self-service way to become admin: against the real
backend, `pnpm admin:promote <phone> admin` in `rakeb-backend`, then sign in
again (a token keeps its role for its TTL); in mock mode only, `/dev` has a
button that flips the single mock user to `admin` instead.

| Route                       | File                          | Title               | Feature          | Endpoints                                                                | Status |
| --------------------------- | ----------------------------- | ------------------- | ---------------- | -------------------------------------------------------------------------- | ------ |
| `/admin`                    | `admin/index.tsx`             | Console admin       | —                | —                                                                        | **implemented** — landing page, one card per section |
| `/admin/users`              | `admin/users/index.tsx`       | Utilisateurs        | `admin/users`    | `GET /admin/users?q=&role=&status=&cursor=`                               | **implemented** — debounced search, role + status filter chips, infinite list |
| `/admin/users/[userId]`     | `admin/users/[userId].tsx`    | Utilisateur         | `admin/users`    | `GET /admin/users/{id}`, `PATCH .../status`, `PATCH .../role`             | **implemented** — profile + stats + verifications, suspend / reactivate / delete, role picker (admin-only; hidden for self and for support) |
| `/admin/licences`           | `admin/licences/index.tsx`    | Vérifications permis | `admin/licences` | `GET /admin/verifications?type=licence&status=&cursor=`                   | **implemented** — status filter chips, infinite list, pull to refresh |
| `/admin/licences/[userId]`  | `admin/licences/[userId].tsx` | Vérification        | `admin/licences` | `GET /admin/verifications/{userId}/licence`, `POST .../review`            | **implemented** — document preview (signed URL), approve, reject with a reason |

---

## `dev` — development only

Gated by `EXPO_PUBLIC_ENABLE_DEV_ROUTES`. The layout redirects to `/(tabs)` when
the flag is off, so the routes are unreachable by deep link as well as invisible.

| Route  | File            | Purpose                                                                                                           |
| ------ | --------------- | ----------------------------------------------------------------------------------------------------------------- |
| `/dev` | `dev/index.tsx` | Index of every route, so all placeholders are reachable before the real flows connect them. Delete once they are. Also carries a "Devenir admin (dev)" button — mock-only, see the `admin` section above. |

---

## Navigation rules

- **Titles** are set per screen with `<Stack.Screen options={{ title }} />`.
  Layouts set only shared options (header colours, back-button style).
- **Typed routes** are enabled. `.expo/types/router.d.ts` is generated by
  `expo start` and included by `tsconfig.json`, so `router.push('/typo')` is a
  compile error. Regenerate after adding a route.
- **Dynamic segments** are read with `useLocalSearchParams<{ id: string }>()`.
  Every placeholder prints the params it received, so a dynamic route is
  verifiable without implementing it.
- **The guard** (`src/auth/use-protected-route.ts`) allows `(auth)` and `dev`
  when signed out; everything else redirects to `/(auth)/welcome`.
- **Role-gated groups** are guarded in their own group layout instead of the
  shared guard above, because role is server data (`GET /me`) and the shared
  guard only knows session status. `admin` is the one example today
  (`admin/_layout.tsx`); it follows the same "redirect from the layout, not
  just hide a link" shape `dev/_layout.tsx` already uses for the env-flag
  gate.
