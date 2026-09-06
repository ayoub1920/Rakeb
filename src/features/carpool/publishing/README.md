# carpool/publishing

**Status:** implemented — `api.ts` / `keys.ts` / `queries.ts` wired to the real backend; screens built. See `docs/ROUTE_MAP.md`.

Everything the driver does: publishing a trip, managing published trips, and
answering booking requests.

## Endpoints — `API Rakeb.md` §7

- `GET /trips/price-suggestion?from=&to=&date=`
- `POST /trips`
- `GET /me/trips?status=published|confirmed|completed`
- `PATCH · DELETE /trips/{id}`
- `GET /me/booking-requests?trip_id=`
- `POST /bookings/{id}/accept` · `POST /bookings/{id}/decline`
- `POST /trips/{id}/start` (validates each passenger's 4-digit `passenger_code`)
- `POST /trips/{id}/complete`

## Screens

- `src/app/carpool/publish/index.tsx` → `route` → `schedule` → `vehicle` →
  `seats` → `price` → `review`

## Notes

- `POST /trips` takes the whole trip in one payload, so the six steps edit a
  **single draft object**. Add a `publish-draft-store` in `src/stores` for it
  rather than six independent forms — and clear it after a successful publish.
- `GET /trips/price-suggestion` returns a recommended price plus a min/max
  range. Render it as a slider anchored on the suggestion. Do not compute a
  suggestion in the client.
- A driving licence must be verified before publishing
  (`POST /me/verifications/licence`); check it before the wizard starts, not at
  the last step.
- Query scope: `QUERY_SCOPES.publishing`.
