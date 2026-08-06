# carpool/places

**Status:** reserved — no code yet.

Tunisian cities and meeting points: autocomplete, place details, and the place
picker UI.

Separate from `search` on purpose: autocomplete is consumed by the passenger
search form **and** by the driver publish wizard's route step. Putting it inside
`search` would make `publishing` import from a sibling feature.

## Endpoints — `API Rakeb.md` §4

- `GET /places/autocomplete?q=&near=`
- `GET /places/{id}`

## Screens

- `src/app/(modals)/select-place.tsx` — the picker, opened from search and publish

## Notes

- Debounce autocomplete and key the query on the trimmed term; every keystroke
  is otherwise a request.
- `near=` should be filled from `services/location` when permission is granted,
  and omitted when it is not — never block the picker on a permission prompt.
- Query scope: `QUERY_SCOPES.places`.
