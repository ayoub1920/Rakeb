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
| `/(auth)/otp`             | `(auth)/otp.tsx`             | Code de vérification | `auth`  | `POST /auth/phone/verify`, `POST /auth/phone/resend`      | placeholder |
| `/(auth)/register`        | `(auth)/register.tsx`        | Créer votre compte   | `auth`  | `POST /auth/register`, `POST /referrals/claim`            | placeholder |
| `/(auth)/login`           | `(auth)/login.tsx`           | Connexion            | `auth`  | `POST /auth/login`                                        | placeholder |
| `/(auth)/forgot-password` | `(auth)/forgot-password.tsx` | Mot de passe oublié  | `auth`  | `POST /auth/password/forgot`, `POST /auth/password/reset` | placeholder |

Route params: `otp` takes `otp_token` and `phone`. The `otp_token` is passed as
a route param rather than stored — it is single-use and short-lived.

---

## `(tabs)` — the five tabs

Tab labels are translated (`tabs.*` keys). Each tab renders `ScreenHeader`
because tab roots have no back button.

| Route       | File                  | Tab      | Feature                 | Endpoints                                  | Status                          |
| ----------- | --------------------- | -------- | ----------------------- | ------------------------------------------ | ------------------------------- |
| `/`         | `(tabs)/index.tsx`    | Accueil  | `carpool/search`        | `GET /trips/nearby`, `GET /promos/banners` | placeholder                     |
| `/services` | `(tabs)/services.tsx` | Services | `services`              | `GET /services`                            | **partial** — real catalogue    |
| `/activity` | `(tabs)/activity.tsx` | Activité | `carpool/bookings`      | `GET /bookings?status=`                    | placeholder                     |
| `/messages` | `(tabs)/messages.tsx` | Messages | `carpool/conversations` | `GET /conversations`                       | placeholder                     |
| `/account`  | `(tabs)/account.tsx`  | Compte   | `profile`               | `GET /me`                                  | **partial** — sign-out is wired |

---

## `carpool` — passenger

| Route                         | File                             | Title                | Feature                 | Endpoints                                       | Status                         |
| ----------------------------- | -------------------------------- | -------------------- | ----------------------- | ----------------------------------------------- | ------------------------------ |
| `/carpool/search`             | `carpool/search.tsx`             | Rechercher un trajet | `carpool/search`        | `GET /places/autocomplete`                      | placeholder                    |
| `/carpool/results`            | `carpool/results.tsx`            | Trajets disponibles  | `carpool/search`        | `GET /trips/search`                             | placeholder                    |
| `/carpool/trip/[id]`          | `carpool/trip/[id].tsx`          | Détails du trajet    | `carpool/trips`         | `GET /trips/{id}`, `/seat-map`, `/quote`        | placeholder                    |
| `/carpool/booking/[id]`       | `carpool/booking/[id].tsx`       | Réservation          | `carpool/bookings`      | `GET /bookings/{id}`, `/cancel`, `/share`       | placeholder                    |
| `/carpool/tracking/[tripId]`  | `carpool/tracking/[tripId].tsx`  | Suivi du trajet      | `carpool/tracking`      | `GET /trips/{id}/tracking`, `WS /ws/trips/{id}` | placeholder + `MapPlaceholder` |
| `/carpool/conversation/[id]`  | `carpool/conversation/[id].tsx`  | Conversation         | `carpool/conversations` | `GET · POST /conversations/{id}/messages`       | placeholder                    |
| `/carpool/review/[bookingId]` | `carpool/review/[bookingId].tsx` | Laisser un avis      | `carpool/reviews`       | `POST /bookings/{id}/review`, `/tip`            | placeholder                    |

Activité (the bookings list) is the `(tabs)/activity` route above, not a
separate carpool route.

---

## `carpool/publish` — driver wizard

Six steps over **one** draft trip, because `POST /trips` takes the whole thing
in a single payload.

| Route                       | File                   | Title               | Endpoints                     |
| --------------------------- | ---------------------- | ------------------- | ----------------------------- |
| `/carpool/publish`          | `publish/index.tsx`    | Publier un trajet   | `GET /me/verifications`       |
| `/carpool/publish/route`    | `publish/route.tsx`    | Itinéraire          | `GET /places/autocomplete`    |
| `/carpool/publish/schedule` | `publish/schedule.tsx` | Date et heure       | —                             |
| `/carpool/publish/vehicle`  | `publish/vehicle.tsx`  | Véhicule            | `GET /me/vehicles`            |
| `/carpool/publish/seats`    | `publish/seats.tsx`    | Places              | —                             |
| `/carpool/publish/price`    | `publish/price.tsx`    | Prix                | `GET /trips/price-suggestion` |
| `/carpool/publish/review`   | `publish/review.tsx`   | Vérifier et publier | `POST /trips`                 |

All placeholders. Feature: `carpool/publishing`.

---

## `carpool/vehicles` — driver vehicles

| Route                    | File                 | Title               | Endpoints                          |
| ------------------------ | -------------------- | ------------------- | ---------------------------------- |
| `/carpool/vehicles`      | `vehicles/index.tsx` | Mes véhicules       | `GET /me/vehicles`                 |
| `/carpool/vehicles/new`  | `vehicles/new.tsx`   | Ajouter un véhicule | `POST /me/vehicles`                |
| `/carpool/vehicles/[id]` | `vehicles/[id].tsx`  | Véhicule            | `PATCH · DELETE /me/vehicles/{id}` |

All placeholders. Feature: `carpool/vehicles`.

---

## `profile`

| Route                      | File                          | Title                 | Feature         | Endpoints                                                         |
| -------------------------- | ----------------------------- | --------------------- | --------------- | ----------------------------------------------------------------- |
| `/profile/edit`            | `profile/edit.tsx`            | Modifier mon profil   | `profile`       | `PATCH /me`, `POST /me/avatar`, `PATCH /me/role`                  |
| `/profile/preferences`     | `profile/preferences.tsx`     | Préférences de voyage | `profile`       | `GET · PUT /me/preferences`                                       |
| `/profile/verifications`   | `profile/verifications.tsx`   | Vérifications         | `profile`       | `GET /me/verifications`, `POST /me/verifications/cin`, `/licence` |
| `/profile/notifications`   | `profile/notifications.tsx`   | Notifications         | `notifications` | `GET · PUT /me/notification-settings`                             |
| `/profile/payment-methods` | `profile/payment-methods.tsx` | Moyens de paiement    | `payments`      | `GET · POST /payment-methods`                                     |
| `/profile/wallet`          | `profile/wallet.tsx`          | Portefeuille          | `wallet`        | `GET /wallet`, `/topup`, `/transactions`                          |
| `/profile/user/[id]`       | `profile/user/[id].tsx`       | Profil                | `profile`       | `GET /users/{id}`, `/reviews`                                     |

All placeholders.

---

## `support`

| Route             | File                 | Title                | Endpoints               |
| ----------------- | -------------------- | -------------------- | ----------------------- |
| `/support`        | `support/index.tsx`  | Aide                 | `GET /help/articles`    |
| `/support/ticket` | `support/ticket.tsx` | Contacter le support | `POST /support/tickets` |
| `/support/report` | `support/report.tsx` | Signaler             | `POST /reports`         |

All placeholders. Feature: `support`. `/support/report` takes `target_type` and
`target_id` params.

---

## `(modals)`

`presentation: 'modal'` is set once on the group layout.

| Route                    | File                        | Purpose                                                                      | Status          |
| ------------------------ | --------------------------- | ---------------------------------------------------------------------------- | --------------- |
| `/(modals)/coming-soon`  | `(modals)/coming-soon.tsx`  | Shown when a `coming_soon` service is tapped. Takes `serviceName`.           | **implemented** |
| `/(modals)/select-place` | `(modals)/select-place.tsx` | Place picker, opened from search and from the publish wizard. Takes `field`. | placeholder     |

---

## `dev` — development only

Gated by `EXPO_PUBLIC_ENABLE_DEV_ROUTES`. The layout redirects to `/(tabs)` when
the flag is off, so the routes are unreachable by deep link as well as invisible.

| Route  | File            | Purpose                                                                                                           |
| ------ | --------------- | ----------------------------------------------------------------------------------------------------------------- |
| `/dev` | `dev/index.tsx` | Index of every route, so all placeholders are reachable before the real flows connect them. Delete once they are. |

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
