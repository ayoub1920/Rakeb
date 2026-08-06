# carpool/vehicles

**Status:** reserved — no code yet.

The driver's vehicles: model, colour, plate, seat count.

Separate from `publishing` because vehicles are managed on their own screens
(from the account tab) as well as picked during the publish wizard.

## Endpoints — `API Rakeb.md` §7

- `GET · POST · PATCH · DELETE /me/vehicles`

## Screens

- `src/app/carpool/vehicles/index.tsx` — list
- `src/app/carpool/vehicles/new.tsx` — add
- `src/app/carpool/vehicles/[id].tsx` — detail / edit

## Notes

- Plates follow the Tunisian `204 TU 3456` format. Validate with Zod in
  `schemas.ts`, and let the server be the authority on duplicates.
- Deleting a vehicle attached to a published trip must be expected to fail;
  surface the API's message rather than pre-checking client-side.
- Query scope: `QUERY_SCOPES.vehicles`.
