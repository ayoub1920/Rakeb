# wallet

**Status:** implemented against `rakeb-backend` (also mirrored in the mock).

The Rakeb wallet: balance (available + on-hold), ledger, top-up and withdraw.
A destination screen with its own state — distinct from `payments`, where a
method is chosen inside the booking flow.

## Endpoints — `API Rakeb.md` §11

- `GET /wallet` — balance (`WalletController` in `rakeb-backend`'s
  `wallet.module.ts`)
- `GET /wallet/transactions` — cursor-paginated ledger, newest first
- `POST /wallet/topup` — `{ amount, payment_method_id }`; `@Idempotent()`
- `POST /wallet/withdraw` — `{ amount, destination_type: 'rib' | 'mobile_money', rib?, msisdn? }`;
  `@Idempotent()`. Reserves the funds immediately; the payout settles async.

## Screens

- `src/app/profile/wallet.tsx`

## Notes

- Amounts are integer millimes end to end. The screen converts to/from dinars
  only at the input boundary (`dinarsToMillimes` / `formatMillimes`).
- `topup` / `withdraw` send a fresh `Idempotency-Key` per attempt, the same
  rule as `POST /bookings` (`createRequestId` from `src/api/request-id`).
- Query scope: `QUERY_SCOPES.wallet`.
