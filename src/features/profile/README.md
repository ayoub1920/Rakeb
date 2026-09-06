# profile

**Status:** implemented against `rakeb-backend` (also mirrored in the mock).
`GET /me/stats`, `GET /users/{id}` and its reviews are the remaining ⬜.

The signed-in user's profile, travel preferences, and driver's-licence
verification.

## Endpoints — `API Rakeb.md` §2

- `GET /me` — also the session probe
- `PATCH /me` — first/last name, birth date, e-mail, bio, locale
- `POST /me/avatar` — `{ upload_id }` from `features/uploads` (purpose
  `avatar`, public bucket)
- `PATCH /me/role` — `rider | driver | both` (staff roles are not
  self-assignable)
- `GET · PUT /me/preferences` — chat / music / smoking / pets, each
  `yes | no | maybe`
- `GET /me/verifications`, `POST /me/verifications/licence` — see the licence
  document; the admin side is `features/admin/licences`

## Screens

- `src/app/profile/edit.tsx`
- `src/app/profile/preferences.tsx`
- `src/app/profile/verifications.tsx`
- `src/app/(tabs)/account.tsx` — the hub

## Notes

- `useCurrentUser` is the single source of truth for the user; mutations
  (`useUpdateProfile`, `useUpdateRole`, `useUpdateAvatar`) write it straight
  back into the `profileKeys.currentUser()` cache.
- Query scope: `QUERY_SCOPES.session` (shared with auth/session state).
