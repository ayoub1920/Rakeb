# taxi

**Status:** implemented — real backend (`rakeb-backend`'s `modules/taxi`), no mock data required to exercise the flow (fixtures exist in `src/api/mock/routes.ts` for offline dev/tests only).

On-demand ride-hailing: driver application + review, ride request/quote,
dispatch, live tracking. A sibling of `features/carpool`, not an extension of
it — nothing here imports from carpool, and carpool imports nothing from
here. Reuses the platform-level `features/places` (autocomplete/reverse-geocode),
`features/uploads` (sign→PUT→confirm), `services/maps`, `services/location`,
`services/socket`.

## Endpoints — `rakeb-backend`'s `modules/taxi`

- `GET · POST /me/taxi/application`, `PATCH /me/taxi/availability`, `POST /me/taxi/location`
- `POST /taxi/rides/quote`, `POST /taxi/rides`, `GET /taxi/rides`, `GET /taxi/rides/{id}`,
  `GET /taxi/rides/{id}/tracking`, `GET /taxi/rides/available`,
  `POST /taxi/rides/{id}/accept|status|cancel`
- Admin: `GET · POST /admin/taxi/applications*`, `GET /admin/taxi/rides*`
  (consumed by `features/admin/taxi`, not this folder)

## Screens

- `src/app/taxi/index.tsx` — landing (passenger vs. driver)
- `src/app/taxi/passenger/*` — search (real Google Maps, real location), active ride
- `src/app/taxi/driver/*` — apply, status, online (dispatch), active ride
- `src/app/admin/taxi/*` — application review, ride oversight

## Notes

- Query scopes: `taxiApplication`, `taxiRides`, `taxiQuote`, `taxiDispatch`, `adminTaxi`.
- Realtime: `/ws/taxi` (`use-taxi-ride-live-updates.ts`) is purely additive — the
  HTTP polls in `queries.ts` stay the source of truth.
- `use-taxi-driver-broadcast.ts` must be mounted once, high up
  (`taxi/driver/_layout.tsx`), so it survives navigating from "go online" into
  an active ride screen.
- `DocumentUploadSlot` and the plate regex (`TUNISIAN_PLATE`) are duplicated
  from the equivalent carpool pieces on purpose — no cross-feature import.
