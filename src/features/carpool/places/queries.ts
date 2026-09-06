import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { STALE_TIME } from '@/api/query-client';
import type { ApiError } from '@/types/api';
import type { Coordinates, Place } from '@/types/models';

import { autocompletePlaces } from './api';
import { placeKeys } from './keys';

/** Below this length the query stays idle — one or two letters match everything. */
export const MIN_AUTOCOMPLETE_LENGTH = 2;

/**
 * `GET /places/autocomplete`.
 *
 * The caller is expected to pass an already-debounced term. `keepPreviousData`
 * keeps the last list on screen while the next one loads, so the results do not
 * flash to empty between keystrokes.
 */
export function usePlaceAutocomplete(term: string, near?: Coordinates | null) {
  const trimmed = term.trim();

  return useQuery<Place[], ApiError>({
    queryKey: placeKeys.autocomplete(trimmed),
    queryFn: ({ signal }) => autocompletePlaces(trimmed, near, { signal }),
    enabled: trimmed.length >= MIN_AUTOCOMPLETE_LENGTH,
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.static,
  });
}
