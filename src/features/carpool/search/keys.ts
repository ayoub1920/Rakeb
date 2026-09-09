import { QUERY_SCOPES } from '@/api/query-keys';

import type { TripSearchParams } from './types';

/**
 * Query keys owned by carpool search.
 *
 * The params object is part of the key, so changing a filter is a new cache
 * entry rather than a refetch of the old one — which is what makes going back
 * to a previous search instant.
 */
export const tripSearchKeys = {
  all: [QUERY_SCOPES.tripSearch] as const,
  results: (params: TripSearchParams) => [QUERY_SCOPES.tripSearch, 'results', params] as const,
  map: (params: TripSearchParams) => [QUERY_SCOPES.tripSearch, 'map', params] as const,
  nearby: (lat: number, lng: number) => [QUERY_SCOPES.tripSearch, 'nearby', lat, lng] as const,
};
