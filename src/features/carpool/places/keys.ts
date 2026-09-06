import { QUERY_SCOPES } from '@/api/query-keys';

/**
 * Query keys owned by carpool places.
 *
 * The autocomplete key is the trimmed term, so an untrimmed and a trimmed
 * spelling of the same query share a cache entry and a keystroke that only adds
 * whitespace is not a new request.
 */
export const placeKeys = {
  all: [QUERY_SCOPES.places] as const,
  autocomplete: (term: string) => [QUERY_SCOPES.places, 'autocomplete', term] as const,
  detail: (placeId: string) => [QUERY_SCOPES.places, 'detail', placeId] as const,
};
