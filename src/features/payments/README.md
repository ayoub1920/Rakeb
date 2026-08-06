# payments

**Status:** reserved — no code yet.

Payment methods and payment intents. Booking-time concerns.

Separate from `wallet`: the wallet is a destination screen with its own balance
and transaction history, while payment methods are chosen inside the booking
flow.

## Endpoints — `API Rakeb.md` §11–12

- `GET · POST /payment-methods`
- `POST /payment-methods/mobile` — D17 / e-DINAR / Flouci
- `PATCH · DELETE /payment-methods/{id}`
- `POST /payments/intents` — authorize at booking, capture at acceptance
- `POST /promos/validate` — `{ code, trip_id }` → discount amount

## Screens

- `src/app/profile/payment-methods.tsx`

## Notes

- **Never handle a raw card number.** Cards are added through the PSP's token,
  as the API specifies. That means a PSP SDK or a hosted web view, chosen
  before this feature is built.
- `POST /webhooks/psp` is server-to-server. It is not a frontend concern.
- Discounts come from `POST /promos/validate` and totals from
  `POST /trips/{id}/quote`. The client displays them; it never computes them.
- Query scope: `QUERY_SCOPES.payments`.
