# payments

**Status:** payment methods + promos implemented against `rakeb-backend`
(also mirrored in the mock). Payment *intents* are still handled inside the
booking flow, not here.

Payment methods are chosen inside the booking flow; this feature also owns
the standalone management screen and promo-code validation.

## Endpoints — `API Rakeb.md` §11–12

- `GET · POST · PATCH · DELETE /payment-methods`
- `POST /payment-methods/mobile` — D17 / e-DINAR / Flouci. Wire `type` is
  `mobile_money` (not `mobile`).
- `POST /promos/validate` — `{ code, trip_id, seats }` → discount amount
- `GET /promos/banners`

## Screens

- `src/app/profile/payment-methods.tsx`

## Notes

- **Never handle a raw card number.** A card is added from a PSP client
  token (`provider_token`); a real build gets it from a PSP SDK / hosted
  field, the dev `fake` PSP accepts any `tok_*` string.
- `cash` and `wallet` are always present (`builtin: true` on the domain
  type) and cannot be added or removed.
- Discounts come from `POST /promos/validate`, totals from
  `POST /trips/{id}/quote`. The client displays them; it never computes them.
- `POST /webhooks/psp` is server-to-server — not a frontend concern.
- Query scope: `QUERY_SCOPES.payments`.
