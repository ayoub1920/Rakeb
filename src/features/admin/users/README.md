# admin/users

**Status:** implemented against `rakeb-backend`'s real
`admin-users.controller.ts` (also mirrored in the mock).

The admin console's user directory: search by phone / e-mail / name, filter
by role and status, view a profile, and — for `admin` only — suspend,
reactivate, soft-delete, or change a user's role.

## Endpoints (not in `API Rakeb.md`)

- `GET /admin/users?q=&role=&status=&cursor=&limit=` — cursor pagination;
  `admin` **or** `support`
- `GET /admin/users/{id}` — profile, `cin`/`licence` statuses, trip counts,
  last seen; `admin` **or** `support`
- `PATCH /admin/users/{id}/status` — `{ status, reason? }`; `admin` only
- `PATCH /admin/users/{id}/role` — `{ role }`, any role; `admin` only

The backend refuses an admin acting on their **own** account
(`400 BAD_REQUEST`), and `suspended`/`deleted` both block login (neither
erases data). `app/admin/users/[userId].tsx` hides the mutating actions when
the viewer is `support` (`useIsFullAdmin()`) or is looking at their own
account.

## Screens

- `src/app/admin/users/index.tsx` — search + filters + list
- `src/app/admin/users/[userId].tsx` — detail + actions

## Notes

- Query scope: `QUERY_SCOPES.adminUsers`.
- The search box debounces with `useDebouncedValue` (`src/utils`), shared
  with the place autocomplete modal.
