# carpool/tracking

**Status:** reserved — no code yet.

Live trip position, ETA, and trip state transitions.

## Endpoints — `API Rakeb.md` §8

- `POST /trips/{id}/position` — driver pushes every 5–10 s
- `GET /trips/{id}/tracking` — position, ETA, traffic (polling fallback)
- `WS /ws/trips/{id}` — `position`, `eta_updated`, `trip_started`, `trip_completed`

## Screens

- `src/app/carpool/tracking/[tripId].tsx`

## Notes

- **The socket is an enhancement, never the source of truth.** The API
  documents polling as a fallback, so the screen must render correctly with the
  socket disconnected. Seed from `GET /trips/{id}/tracking`, then let socket
  events update the query cache with `queryClient.setQueryData`.
- Connect in an effect on mount and `disconnect()` on unmount —
  `services/socket` never auto-connects.
- The map comes from `services/maps`; do not import `react-native-maps` here.
- Query scope: `QUERY_SCOPES.tracking`.
