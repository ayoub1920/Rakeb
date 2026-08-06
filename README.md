# Rakeb — mobile frontend

> **This repository currently contains the frontend scaffold and architecture.
> Product screens and full business flows are intentionally not implemented yet.**

Rakeb is a Tunisian multi-service app. Only **covoiturage (carpool)** is active;
taxi, food and grocery exist in the service catalogue as `coming_soon` and open
a coming-soon modal.

The backend contract this client targets is [`API Rakeb.md`](./API%20Rakeb.md)
(REST v1, bearer auth, cursor pagination, amounts in millimes).

---

## Stack

|                     |                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------ |
| Runtime             | React Native 0.86 · Expo SDK 57 · React 19 · TypeScript 6 (strict)                   |
| Navigation          | Expo Router 57 (file-based, typed routes)                                            |
| Data                | Axios · TanStack Query 5                                                             |
| Client state        | Zustand 5                                                                            |
| Forms               | React Hook Form · Zod 4                                                              |
| Secure storage      | Expo SecureStore                                                                     |
| i18n                | i18next · react-i18next · Expo Localization (French default, Arabic + RTL ready)     |
| Dates               | date-fns 4                                                                           |
| Prepared, not wired | react-native-maps · Expo Location · Socket.IO client · Expo Notifications            |
| Tooling             | pnpm · Jest 29 (`jest-expo`) · React Native Testing Library 13 · ESLint 9 · Prettier |

---

## Requirements

- Node 20 or later (developed on 22)
- pnpm 11 (`npm install -g pnpm`)
- Expo Go on a device, or an Android/iOS simulator

---

## Getting started

```bash
pnpm install
cp .env.example .env      # defaults are fine: mock mode on, no backend needed
pnpm start
```

Then press `a` for Android, `i` for iOS, or scan the QR code with Expo Go.

With `EXPO_PUBLIC_ENABLE_MOCK_API=true` (the default in `.env.example`) the app
runs entirely from local fixtures — no backend required.

To browse every placeholder screen, keep `EXPO_PUBLIC_ENABLE_DEV_ROUTES=true`
and open `/dev`. To skip the auth flow while its screens are placeholders, set
`EXPO_PUBLIC_DEV_AUTH_MODE=true`.

---

## Scripts

| Script                                   | Does                              |
| ---------------------------------------- | --------------------------------- |
| `pnpm start`                             | Expo dev server                   |
| `pnpm android` / `pnpm ios` / `pnpm web` | Dev server targeting one platform |
| `pnpm typecheck`                         | `tsc --noEmit`                    |
| `pnpm lint` / `pnpm lint:fix`            | ESLint                            |
| `pnpm format` / `pnpm format:check`      | Prettier                          |
| `pnpm test` / `pnpm test:watch`          | Jest                              |

---

## Environment

All configuration is read in `src/config/env.ts` and **nowhere else** — an
ESLint rule enforces it, because Expo only inlines literal
`process.env.EXPO_PUBLIC_*` expressions and a dynamic read silently becomes
`undefined` in a release build.

| Variable                        | Default                 | Meaning                                       |
| ------------------------------- | ----------------------- | --------------------------------------------- |
| `EXPO_PUBLIC_API_URL`           | `http://localhost:3000` | API base URL; `/v1` is appended by the client |
| `EXPO_PUBLIC_WS_URL`            | `http://localhost:3000` | Socket.IO server                              |
| `EXPO_PUBLIC_ENABLE_MOCK_API`   | `true`                  | Serve every request from fixtures             |
| `EXPO_PUBLIC_ENABLE_DEV_ROUTES` | `true`                  | Expose `/dev`                                 |
| `EXPO_PUBLIC_DEV_AUTH_MODE`     | `false`                 | Start with a fake session (development only)  |

Everything prefixed `EXPO_PUBLIC_` ships inside the JavaScript bundle. **No
secrets, ever.**

---

## Project structure

```
src/
├── app/            Expo Router routes — routing only
├── features/       Feature logic: API calls, queries, schemas, components
├── components/     Shared components with no domain knowledge
├── api/            Axios client, errors, query client, mock adapter
├── auth/           Session lifecycle: storage, restore, refresh, guards
├── config/         Environment + constants
├── providers/      Provider tree
├── services/       Sockets, maps, location, notifications
├── stores/         Zustand stores
├── theme/          Design tokens
├── localization/   i18next, fr/ar catalogues, RTL
├── types/          Transport types + temporary domain models
├── utils/          Money, dates, logging, assertions
└── testing/        Render helpers, Jest setup
```

Route files handle routing, route params, navigation options and screen
composition. Everything else lives in `src/features/<feature>`. A feature folder
containing only a `README.md` is reserved but not implemented — that README says
what it will own, which endpoints, and the traps specific to it.

---

## Documentation

| Document                                                           | Contents                                                                                                                                                                            |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/FRONTEND_ARCHITECTURE.md`](./docs/FRONTEND_ARCHITECTURE.md) | Folder responsibilities, feature boundaries, navigation, API and auth architecture, state rules, and recipes: how to add a screen, a query, a mutation, a feature, or a new service |
| [`docs/ROUTE_MAP.md`](./docs/ROUTE_MAP.md)                         | Every route, its file, its feature, its endpoints                                                                                                                                   |
| [`docs/API_MAPPING.md`](./docs/API_MAPPING.md)                     | Every endpoint from `API Rakeb.md` and the file it belongs in                                                                                                                       |
| [`docs/API_FRONTEND_ANALYSIS.md`](./docs/API_FRONTEND_ANALYSIS.md) | How the backend contract shaped these decisions, plus open questions for the backend team                                                                                           |

---

## What is implemented

- The full folder architecture and navigation scaffold: 41 screens, 9 layouts,
  a not-found route.
- Axios client: bearer injection, request IDs, timeouts, normalized `ApiError`,
  single-flight token refresh with request replay.
- Authentication architecture: SecureStore token storage, session restoration,
  loading/authenticated/unauthenticated states, sign-out, router guard.
- Eight example API functions: `getServices`, `getAppConfig`, `getCurrentUser`,
  `startPhoneAuth`, `verifyPhoneOtp`, `searchTrips`, `getTrip`, `getBookings`.
- Mock mode as an Axios adapter, with fixtures for services, config, the current
  user, trips and bookings.
- Design tokens and ten shared components.
- French/Arabic i18next setup with RTL helpers.
- Service catalogue with the coming-soon modal — the extension point for taxi,
  food and grocery.

## What is intentionally not implemented

- Every product screen. Routes render a `DevelopmentPlaceholder` naming the
  feature folder and endpoints that will implement them.
- Booking, payment, tracking, chat, wallet, maps and notification flows.
- All but eight of the endpoints in `API Rakeb.md` — see `docs/API_MAPPING.md`.
- Real map rendering. `react-native-maps` is installed but never imported;
  features use `services/maps`, and Android will need a Google Maps API key in
  `app.json`.
- Socket subscriptions and push registration. The adapters exist; nothing calls
  them, and neither prompts for permission at startup.
- Dark mode, animations, skeletons, offline cache persistence, icons in the tab
  bar.

---

## Notes for contributors

- **pnpm layout.** `.npmrc` sets `node-linker=hoisted`; Metro does not fully
  support pnpm's isolated `node_modules`.
- **Typed routes.** `.expo/types/router.d.ts` is generated by `expo start`. After
  adding a route, run `pnpm start` once before `pnpm typecheck`.
- **Version pins that matter.** `jest-expo@57` targets **Jest 29**, and
  `expo-router`'s testing helpers target **React Native Testing Library 13**
  (v14 made its API async). `react-test-renderer` must match `react` exactly
  (19.2.3). Upgrading any of these three is a coordinated change.
- **Amounts are integer millimes.** Format with `utils/money`; never do
  arithmetic on a price. `POST /trips/{id}/quote` is the authority on totals.
- **Do not copy server data into Zustand.** Server data belongs to TanStack
  Query; two sources of truth for seat availability is a bug waiting to happen.
