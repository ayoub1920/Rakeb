# wallet

**Status:** reserved — no code yet.

Balance, top-ups, withdrawals, and the transaction ledger.

## Endpoints — `API Rakeb.md` §11

- `GET /wallet` — available and pending balance
- `POST /wallet/topup`
- `POST /wallet/withdraw` — to RIB or mobile money
- `GET /wallet/transactions` — cursor paginated

## Screens

- `src/app/profile/wallet.tsx`

## Notes

- Balances are money: use `STALE_TIME.realtime` and `refetchOnMount: 'always'`.
  A stale balance shown after a top-up is a support ticket.
- Every amount is millimes. Format with `utils/money`; a float here is a bug.
- Transactions mix debits, seat sales, referral credit and refunds — model the
  kind as a discriminated union and use `assertNever` on it.
- Query scope: `QUERY_SCOPES.wallet`.
