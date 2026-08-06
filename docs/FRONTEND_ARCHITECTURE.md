# Frontend architecture

Rakeb mobile client — React Native + Expo + TypeScript, Expo Router, TanStack
Query, Zustand.

This document explains what lives where and why. For the route list see
[`ROUTE_MAP.md`](./ROUTE_MAP.md); for the endpoint-to-file table see
[`API_MAPPING.md`](./API_MAPPING.md); for how the backend contract shaped these
decisions see [`API_FRONTEND_ANALYSIS.md`](./API_FRONTEND_ANALYSIS.md).

---

## 1. Folder responsibilities

```
src/
├── app/            Expo Router routes. Routing only.
├── features/       Feature logic: API calls, queries, schemas, components.
├── components/     Shared components that know nothing about the domain.
├── api/            Axios client, error normalization, query client, mock adapter.
├── auth/           Session lifecycle: storage, restore, refresh, guards.
├── config/         Environment access and app constants.
├── providers/      The provider tree.
├── services/       Device and transport concerns: sockets, maps, location, push.
├── stores/         Zustand stores for client-only state.
├── theme/          Design tokens.
├── localization/   i18next setup, catalogues, RTL.
├── types/          Transport types and temporary domain models.
├── utils/          Money, dates, logging, assertions.
└── testing/        Render helpers and Jest setup.
```

| Folder        | Owns                                                          | Never contains                                                            |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `app/`        | Routing, route params, navigation options, screen composition | API calls, business logic, styling beyond layout                          |
| `features/`   | Everything specific to one product area                       | Anything a second feature needs (that moves to `components/` or `utils/`) |
| `components/` | Generic UI used by ≥ 2 features                               | Domain knowledge — a `TripCard` is not shared UI                          |
| `api/`        | Transport: interceptors, errors, pagination, mock adapter     | Endpoint definitions (those live in features)                             |
| `auth/`       | Session lifecycle and the router guard                        | UI, and the auth _screens_ (those are `features/auth`)                    |
| `services/`   | Device/transport adapters behind interfaces                   | Feature logic, API endpoint calls                                         |
| `stores/`     | Small client-only state                                       | Copies of server data                                                     |

Two rules the linter enforces, because documentation alone does not hold:

- `process.env` is readable only in `src/config/env.ts`.
- `src/app/**` cannot import `axios`, `@/api/client` or `@/api/request`.

### The `src/app` rule in practice

A route file should be short enough to read at a glance:

```tsx
export default function TripDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isPending, error } = useTrip(id); // ← feature hook

  if (isPending) return <LoadingView />;
  if (error) return <ErrorView error={error} />;
  return <TripDetails trip={data} />; // ← feature component
}
```

Route params in, feature hook, feature component out. If a route file grows a
`useMutation`, a Zod schema or a `StyleSheet` of more than a few rules, that code
belongs in `src/features/<feature>`.

---

## 2. Feature boundaries

```
features/
├── auth/                  phone OTP, login, register, password reset
├── services/              service catalogue + app config
├── profile/               own profile, public profiles, verifications
├── carpool/
│   ├── places/            autocomplete, place picker
│   ├── search/            trip search and filters
│   ├── trips/             trip read model (passenger + driver)
│   ├── bookings/          passenger bookings
│   ├── publishing/        driver: publish, manage, booking requests
│   ├── vehicles/          driver vehicles
│   ├── tracking/          live position, ETA
│   ├── conversations/     messaging
│   └── reviews/           ratings, tags, tips
├── payments/              payment methods, intents, promos
├── wallet/                balance, top-up, withdraw, transactions
├── notifications/         device registration, notification settings
└── support/               help, tickets, reports, SOS
```

**A folder containing only a `README.md` is not implemented yet.** Each of those
READMEs states the feature's responsibility, the endpoints it owns, its screens,
and the traps specific to it. Implemented features contain code instead.

Currently implemented: `auth` (partially), `services`, `profile` (partially),
`carpool/search`, `carpool/trips`, `carpool/bookings` (one endpoint each).

### Standard feature layout

```
features/<feature>/
├── api.ts          endpoint functions — the only place HTTP happens
├── keys.ts         query-key factory built on a scope from api/query-keys.ts
├── queries.ts      useQuery / useInfiniteQuery / useMutation hooks
├── schemas.ts      Zod schemas for this feature's forms
├── types.ts        request/response types local to this feature
└── components/     components that know this feature's domain
```

Not every feature needs every file. Add them as they earn their place.

### Cross-feature rules

- A feature may import from `components`, `api`, `auth`, `config`, `services`,
  `stores`, `theme`, `types`, `utils`, `localization`.
- A feature may **not** import from another feature. If two need the same thing,
  it is not feature code — move it up. (The one deliberate exception is
  `auth/session.ts` importing `features/auth/api`, so that every HTTP call in
  the app lives in a feature; it is documented in that file.)
- Nothing outside `features/carpool` imports from it. That is what lets `taxi`
  arrive without touching carpool.

---

## 3. Navigation

Expo Router, file-based, with `src/app` as the root.

```
src/app/
├── _layout.tsx        providers + root Stack + auth guard
├── +not-found.tsx
├── (auth)/            welcome, phone, otp, register, login, forgot-password
├── (tabs)/            Accueil · Services · Activité · Messages · Compte
├── carpool/           search, results, trip, booking, tracking, conversation,
│                      review, publish/*, vehicles/*
├── profile/           edit, preferences, verifications, notifications,
│                      payment-methods, wallet, user/[id]
├── support/           help, ticket, report
├── (modals)/          coming-soon, select-place
└── dev/               route index (EXPO_PUBLIC_ENABLE_DEV_ROUTES)
```

- **Groups in parentheses** (`(auth)`, `(tabs)`, `(modals)`) do not appear in the
  URL. They exist to share a layout — a tab bar, a modal presentation.
- **Titles are set per screen** with `<Stack.Screen options={{ title }} />`, so a
  title lives next to the screen it names. Layouts set the _shared_ options
  (header colours, back-button style).
- **`(auth)` hides the native header** and uses `ScreenHeader` instead; the swipe
  back gesture still works. Every other stack keeps the native header.
- Typed routes are on (`experiments.typedRoutes`). `.expo/types/router.d.ts` is
  generated by `expo start` and included by `tsconfig.json`, so `router.push`
  is checked against the real route tree.

### Navigation protection

`src/auth/use-protected-route.ts`, mounted once in the root layout:

| Auth status       | Location         | Result                                                               |
| ----------------- | ---------------- | -------------------------------------------------------------------- |
| `loading`         | anywhere         | nothing — the root layout renders a spinner instead of the navigator |
| `unauthenticated` | outside `(auth)` | redirect to `/(auth)/welcome`                                        |
| `authenticated`   | inside `(auth)`  | redirect to `/(tabs)`                                                |

The root layout withholds the navigator entirely while the status is `loading`,
so a signed-in user never sees a frame of the welcome screen on a cold start.

---

## 4. API architecture

```
Feature queries.ts        useQuery / useMutation
        ↓
Feature api.ts            apiGet('/trips/search', params)
        ↓
api/request.ts            unwraps .data, maps RequestOptions
        ↓
api/client.ts             Axios instance
   request interceptor    x-request-id, Bearer token
   response interceptor   401 → refresh once → replay, then normalize errors
        ↓
network  ·or·  api/mock/mock-adapter.ts   (EXPO_PUBLIC_ENABLE_MOCK_API)
```

- **Base URL** — `EXPO_PUBLIC_API_URL` + `/v1`.
- **Timeout** — 15 s (`REQUEST_TIMEOUT_MS`).
- **Request IDs** — every request carries `x-request-id`; it comes back on
  `ApiError.requestId` and is what a support ticket needs.
- **Errors** — everything rejects with `ApiError`
  (`{ code, message, field?, status?, requestId? }`). Network failures,
  timeouts and cancellations are mapped onto the same shape.
- **Pagination** — cursor only. `CursorPage<T>` + the three helpers in
  `api/pagination.ts` are the whole integration with `useInfiniteQuery`.
- **Mock mode** — installed as an Axios _adapter_, so interceptors, auth headers
  and error handling behave identically. No feature knows which is active.

### Adding an endpoint

[`API_MAPPING.md`](./API_MAPPING.md) lists every remaining endpoint from
`API Rakeb.md` with the file it belongs in. See §7 below for the mechanics.

### Replacing the domain types

`src/types/models.ts` is hand-written and incomplete. It is meant to be replaced
by types generated from the NestJS OpenAPI document — which is why the whole
client keeps the backend's `snake_case` field names rather than mapping to
camelCase. When the generator lands, that file is deleted, not extended.

---

## 5. Authentication

```
src/auth/
├── token-storage.ts       Expo SecureStore adapter (never AsyncStorage)
├── session.ts             restore · start · end · single-flight refresh
├── auth-bridge-setup.ts   registers the session layer with the Axios client
├── AuthProvider.tsx       side effects: restore at mount, clear cache on sign-out
├── use-auth.ts            useAuth() / useAuthStatus() / useIsAuthenticated()
├── use-protected-route.ts the router guard
└── dev-auth.ts            EXPO_PUBLIC_DEV_AUTH_MODE

src/stores/auth-store.ts   status + tokens (Zustand)
```

Three decisions worth knowing:

1. **State and effects are separate files.** The Axios request interceptor must
   read the access token _synchronously_, which rules out a React context. The
   Zustand store is that synchronous surface; `AuthProvider` owns the effects.
2. **The bridge is registered at module load**, not in an effect. React runs
   child effects before parent effects, so a screen's first query can fire
   before `AuthProvider`'s effect would have run — and would go out without an
   `Authorization` header.
3. **Refresh is single-flight.** Concurrent 401s share one in-flight refresh.
   Without it, a screen with four parallel queries burns four refresh tokens,
   and with rotation three get rejected — signing the user out mid-session.

Sign-out clears SecureStore, the store, and the entire query cache. The cache
clear is not optional: without it the next account to sign in on the device
briefly sees the previous one's trips.

`EXPO_PUBLIC_DEV_AUTH_MODE=true` starts with an obviously fake session so the
app opens past the auth flow while those screens are placeholders. It is
development-only and `assertEnvIsUsable()` refuses to start a production build
with it on.

---

## 6. State management

| Kind of state                       | Tool                  | Example                                  |
| ----------------------------------- | --------------------- | ---------------------------------------- |
| Server data                         | TanStack Query        | trips, bookings, the user, the catalogue |
| Client state that outlives a screen | Zustand               | search criteria, session tokens          |
| Local UI state                      | `useState`            | whether a filter sheet is open           |
| Form state                          | React Hook Form + Zod | phone number, vehicle, publish steps     |

**Never copy server data into Zustand.** A trip in a store and the same trip in
the query cache will disagree, and the one the user sees will be the stale one.
If two screens need the same server data, they call the same query hook — the
cache is the sharing mechanism.

Current stores:

- `auth-store` — status and tokens.
- `carpool-search-store` — origin, destination, date, seat count.

`STALE_TIME` in `api/query-client.ts` names four staleness tiers (`static`,
`session`, `volatile`, `realtime`). Pick one per query instead of inventing a
number; the reasoning per data class is in `API_FRONTEND_ANALYSIS.md` §5.

---

## 7. Recipes

### How to add a screen

1. Create the route file under the right group, e.g.
   `src/app/carpool/booking/[id].tsx`. The filename is the URL.
2. Set its title: `<Stack.Screen options={{ title: 'Réservation' }} />`.
3. Read params with `useLocalSearchParams<{ id: string }>()`.
4. Put the content in `src/features/<feature>/components/`, not in the route.
5. Run `pnpm start` once so typed routes regenerate, then `pnpm typecheck`.

### How to add an API query

1. Add the function to `src/features/<feature>/api.ts`:
   ```ts
   export function getSeatMap(tripId: string, options?: RequestOptions) {
     return apiGet<SeatMap>(`/trips/${tripId}/seat-map`, undefined, options);
   }
   ```
2. Add a key to that feature's `keys.ts` (built on its scope from
   `api/query-keys.ts`).
3. Add the hook in `queries.ts`, choosing a `STALE_TIME` tier:
   ```ts
   export function useSeatMap(tripId: string | undefined) {
     return useQuery<SeatMap, ApiError>({
       queryKey: tripKeys.seatMap(tripId ?? ''),
       queryFn: ({ signal }) => getSeatMap(tripId as string, { signal }),
       enabled: Boolean(tripId),
       staleTime: STALE_TIME.volatile,
     });
   }
   ```
4. If the endpoint is paginated, use `useInfiniteQuery` with `INITIAL_CURSOR`
   and `getNextCursor` — copy `features/carpool/search/queries.ts`.
5. Add a fixture in `src/api/mock/routes.ts` so mock mode still works.

### How to add a mutation

1. Add the call to `api.ts`.
2. Add the hook to `queries.ts`, and decide what it invalidates:
   ```ts
   export function useCancelBooking() {
     const queryClient = useQueryClient();
     return useMutation<Booking, ApiError, { bookingId: string }>({
       mutationFn: ({ bookingId }) => cancelBooking(bookingId),
       onSuccess: (booking) => {
         queryClient.invalidateQueries({ queryKey: bookingKeys.all });
         queryClient.setQueryData(bookingKeys.detail(booking.id), booking);
       },
     });
   }
   ```
3. Invalidation is the hard part. Ask what _else_ changed: cancelling a booking
   frees a seat, so the trip and the search results are stale too.
4. Surface `{ field }` errors on the form with
   `setError(error.field, { message: error.message })`.
5. Mutations do not retry (no idempotency key is documented). Do not turn that
   on per-call without one.

### How to add a new feature

1. Create `src/features/<feature>/` with `api.ts`, `keys.ts`, `queries.ts`.
2. Reserve a scope in `src/api/query-keys.ts` first — that is what makes
   cross-feature invalidation safe.
3. Add routes under `src/app/`, keeping the boundary: routes compose, features
   implement.
4. Replace the folder's `README.md` with real code, or update it if the feature
   is only partly built.
5. Add fixtures to `src/api/mock/routes.ts`.

### How future taxi / food services should be added

The catalogue is data, not code. A service going live is three steps:

1. **Backend** flips `status` to `"live"` in `GET /services`.
2. **Frontend** adds a route group `src/app/taxi/` and a feature folder
   `src/features/taxi/`.
3. **Register the entry route** in `src/features/services/service-registry.ts`:
   ```ts
   const SERVICE_ROUTES: Record<ServiceId, Href | null> = {
     carpool: '/carpool/search',
     taxi: '/taxi/search', // ← was null
     food: null,
     grocery: null,
   };
   ```

Nothing that renders the catalogue changes, and nothing in `features/carpool` is
touched. Until step 3, a service with `status: "coming_soon"` — or a live one
with no route — opens `/(modals)/coming-soon`. The API status always wins over
the local table, so a service can be switched off server-side without an app
release.

---

## 8. UI foundation

Design tokens in `src/theme`: `colors`, `spacing`, `typography`, `radius`,
`shadows`, `sizes`. Components reference tokens, never literals.

Shared components: `AppText`, `AppButton`, `AppInput`, `AppCard`, `Screen`,
`ScreenHeader`, `LoadingView`, `EmptyView`, `ErrorView`,
`DevelopmentPlaceholder`.

This is deliberately not a design system — no variants matrix, no theming
context, no dark mode. Tokens are a frozen object so `StyleSheet.create` stays
at module scope, which is what makes styles cheap. If dark mode is added, the
tokens become two objects selected by a provider and only `theme` consumers
change.

Accessibility baseline, already in the components: every pressable reaches the
44 pt minimum target, `AppButton` announces `busy` while loading, `AppInput`
binds its label and announces errors through a live region rather than colour
alone, and `allowFontScaling` is on everywhere.

---

## 9. Services layer

`src/services` holds adapters for things that are not the API.

| Service          | State                            | Rule                                                                                                                                                     |
| ---------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `maps/`          | interface + placeholder          | Features import `services/maps`, never `react-native-maps`. Swapping the provider must change one file.                                                  |
| `socket/`        | real transport, no subscriptions | **Never connects automatically.** A screen connects on mount and disconnects on unmount. Sockets enhance query data; they are never the source of truth. |
| `location/`      | implemented, unused              | **Never prompts at startup.** Permission is requested from a user action that needs it.                                                                  |
| `notifications/` | Expo adapter, no API calls       | **Never prompts at startup.** `buildDeviceRegistration` stops at the payload; sending it is `features/notifications`.                                    |

---

## 10. Environment

All configuration is read in `src/config/env.ts` and nowhere else.

| Variable                        | Meaning                                       |
| ------------------------------- | --------------------------------------------- |
| `EXPO_PUBLIC_API_URL`           | API base URL; `/v1` is appended by the client |
| `EXPO_PUBLIC_WS_URL`            | Socket.IO server                              |
| `EXPO_PUBLIC_ENABLE_MOCK_API`   | Serve everything from fixtures                |
| `EXPO_PUBLIC_ENABLE_DEV_ROUTES` | Expose `/dev`                                 |
| `EXPO_PUBLIC_DEV_AUTH_MODE`     | Start with a fake session (development only)  |

Expo inlines `process.env.EXPO_PUBLIC_*` at build time **only** for literal
member expressions — `process.env[key]` silently becomes `undefined` in a
release bundle. That is why every variable is spelled out in `env.ts` and why
the ESLint rule exists. Everything prefixed `EXPO_PUBLIC_` ships inside the
JavaScript bundle: no secrets, ever.

---

## 11. Testing

`jest-expo` + React Native Testing Library. `src/testing/render.tsx` provides
`renderWithProviders` (full provider tree) and `createQueryWrapper` (cache only).
`src/testing/jest-env.ts` forces mock mode before any module loads, so tests
never touch the network.

The suite is a scaffold smoke test, not coverage: a component, the auth store,
a utility, a query through the mock adapter, and the whole router mounting.

---

## 12. What is intentionally not implemented

- Every product screen. Route files render `DevelopmentPlaceholder`.
- Booking, payment, tracking, chat, wallet, maps and notification flows.
- All but eight endpoints — see `API_MAPPING.md`.
- Icons in the tab bar (no icon set is a dependency; picking one is a design
  decision).
- Dark mode, animations, skeletons, empty-state illustrations.
- Offline persistence of the query cache.
- The map provider (`react-native-maps` is installed but never imported;
  Android also needs a Google Maps API key in `app.json`).
- Socket subscriptions and push registration — the adapters exist, nothing calls
  them.
