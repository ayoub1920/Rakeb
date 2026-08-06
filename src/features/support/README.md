# support

**Status:** reserved — no code yet.

Help centre, support tickets, reporting a user or a trip, and the in-trip SOS.

## Endpoints — `API Rakeb.md` §13

- `GET /help/articles` · `GET /help/articles/{slug}`
- `POST /support/tickets`
- `POST /reports` — `{ target_type, target_id, reason, details }`
- `POST /sos` — emergency alert during a trip (position + contacts)

## Screens

- `src/app/support/index.tsx` — help centre
- `src/app/support/ticket.tsx` — contact support
- `src/app/support/report.tsx` — report a user or trip

## Notes

- Attach `ApiError.requestId` to a support ticket when one is opened from an
  error state. `ErrorView` already surfaces it in development; wiring it through
  to the ticket form is what makes it useful in production.
- `POST /sos` is safety-critical: it must send the current position even when
  the location permission was only just granted, and it must not be blocked
  behind a confirmation dialog with a small tap target.
- Query scope: `QUERY_SCOPES.support`.
