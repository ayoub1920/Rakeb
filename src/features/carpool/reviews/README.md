# carpool/reviews

**Status:** reserved — no code yet.

Ratings, compliment tags, and tips after a completed trip.

## Endpoints — `API Rakeb.md` §10

- `GET /me/pending-reviews`
- `POST /bookings/{id}/review` — `{ rating: 1-5, tags, comment }`
- `GET /reviews/tags`
- `POST /bookings/{id}/tip` — 1 / 2 / 5 DT or free amount
- `GET /users/{id}/reviews` — reads live in `features/profile`

## Screens

- `src/app/carpool/review/[bookingId].tsx`

## Notes

- `GET /reviews/tags` is static catalogue data — `STALE_TIME.static`.
- Tipping is a payment action inside a review screen. The amount is in
  millimes; format with `utils/money`, never compute a total here.
- Submitting a review must invalidate `GET /me/pending-reviews` and the
  reviewed user's public profile.
- Query scope: `QUERY_SCOPES.reviews`.
