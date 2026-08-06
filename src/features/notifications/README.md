# notifications

**Status:** reserved — no code yet.

Device registration, notification preferences, and handling an incoming push.

Device registration lives here rather than in `profile` because it belongs with
push, not with the user's identity.

## Endpoints — `API Rakeb.md` §3

- `POST /me/devices` — `{ platform, push_token, locale }`
- `DELETE /me/devices/{id}` — on sign-out
- `GET · PUT /me/notification-settings`
- `POST /me/location` — opt-in last known position

## Screens

- `src/app/profile/notifications.tsx`

## Notes

- The Expo adapter is already in `src/services/notifications`. This feature
  supplies the API calls and the UI, not the device plumbing.
- **Do not request permission at startup.** Ask after the user has seen why it
  matters — a cold prompt on first launch is a permanent denial.
- Register the device after sign-in, and delete it in `endSession()` — there is
  a TODO in `src/auth/session.ts` marking the exact spot.
- Query scope: `QUERY_SCOPES.notifications`.
