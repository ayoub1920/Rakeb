# places

**Status:** implemented (mock-backed) — `api.ts`, `keys.ts`, `queries.ts` wired; screens consume them. Socket / WS layers and secondary endpoints noted below remain TODO.

Tunisian cities and meeting points: autocomplete, place details, and the place
picker UI.

Platform-level on purpose (promoted out of `features/carpool/places`, 2026-09):
autocomplete is consumed by the carpool passenger search form, the carpool
publish wizard's route step, *and* the taxi passenger search screen. Any one
of those importing from another feature would violate the cross-feature
import ban, so this lives outside all of them, next to `services`/`uploads`.

## Endpoints — `API Rakeb.md` §4

- `GET /places/autocomplete?q=&near=`
- `GET /places/{id}`

## Screens

- `src/app/(modals)/select-place.tsx` — the picker, opened from carpool search/publish and taxi search
- `src/app/(modals)/pick-on-map.tsx` — drop-a-pin, reverse-geocodes through here

## Notes

- Debounce autocomplete and key the query on the trimmed term; every keystroke
  is otherwise a request.
- `near=` should be filled from `services/location` when permission is granted,
  and omitted when it is not — never block the picker on a permission prompt.
- Query scope: `QUERY_SCOPES.places`.
