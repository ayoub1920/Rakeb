# uploads

**Status:** implemented against `rakeb-backend`'s real `UploadsController`
(also mirrored in the mock).

Object storage — the presigned-URL flow every file upload in the app goes
through, first used by the driver's licence document
(`features/profile/api.ts`'s `submitLicence`).

## Endpoints — `rakeb-backend`'s `src/modules/uploads`

- `POST /uploads/sign` — returns a pre-signed `PUT` URL (S3/MinIO) plus
  `upload_id`
- `POST /uploads/{id}/confirm` — call once the `PUT` succeeds; an unconfirmed
  upload cannot be referenced by a submitting endpoint
  (`POST /me/verifications/licence` rejects it with `UPLOAD_NOT_CONFIRMED`)

`GET /uploads/{id}` exists on the backend too but is ownership-gated (a
caller can only read their own upload's metadata) — not called from here; an
admin views another user's document through the resolved
`front_upload_url` on `GET /admin/verifications/{userId}/{type}`
(`features/admin/licences`), a signed download URL the backend generates
itself for that one case.

## What's here

- `uploadFile(purpose, file)` — the whole sign → `PUT` → confirm round trip.
  The `PUT` goes through `apiPut` (`apiClient`), not a bare `fetch`: axios
  treats an absolute URL as an override of `baseURL`, and mock mode can only
  answer a request that actually reaches the adapter it installs on
  `apiClient`.

## Notes

- No `queries.ts` — a one-shot upload isn't cached data; callers use
  `uploadFile` directly inside their own mutation (see
  `features/profile/queries.ts`'s `useSubmitLicence`).
- Multipart was considered and rejected: the backend always uses presigned
  uploads, for every purpose (avatar included, whenever that's wired) — see
  `docs/API_MAPPING.md` §2a.
