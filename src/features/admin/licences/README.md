# admin/licences

**Status:** implemented against `rakeb-backend`'s real
`admin-verifications.controller.ts` (also mirrored in the mock).

The admin queue for reviewing drivers' licence submissions: list, detail,
approve, reject. Gates `carpool/publishing` — a driver cannot publish a trip
until their licence here is `approved` (`features/profile` §`verifications`).

## Endpoints (not in `API Rakeb.md` — implemented directly in `rakeb-backend`)

- `GET /admin/verifications?type=licence&status=&cursor=&limit=` — real
  cursor pagination; the endpoint also serves `cin` rows, this app pins
  `type=licence`
- `GET /admin/verifications/{userId}/licence` — includes `front_upload_url`,
  a short-lived signed download URL for the document image
- `POST /admin/verifications/{userId}/licence/review` — body
  `{ status: 'approved' | 'rejected', reason? }`

Every one of these requires the `admin` or `support` role server-side. The
frontend guard (`app/admin/_layout.tsx`) only avoids flashing the screen at a
non-staff caller — it is not the security boundary; a direct request from a
non-staff session gets `403 forbidden` from whatever answers these routes
(the mock does; `rakeb-backend`'s `RolesGuard` does too).

## Screens

- `src/app/admin/licences/index.tsx` — queue, filterable by status
- `src/app/admin/licences/[userId].tsx` — detail, approve / reject

## Notes

- One driver has at most one licence-verification record; a resubmission
  after a rejection updates it in place (see `LicenceVerification` in
  `src/types/models.ts`).
- The document itself never reaches this feature's `api.ts` — the document
  URL is a signed URL the backend resolves; uploading is
  `features/uploads/api.ts`'s job (used from `features/profile`, not here).
- Query scope: `QUERY_SCOPES.adminLicences`.
