import { QUERY_SCOPES } from '@/api/query-keys';
import type { Coordinates } from '@/types/models';

/**
 * Query keys owned by the platform-level `places` feature.
 *
 * The autocomplete key is the trimmed term plus a coarse `near` bucket: the
 * backend biases results toward `near`, so two different locations must not
 * share a cache entry. Rounding to ~1 km keeps a tiny GPS jitter from busting
 * the cache on every render.
 */
function nearBucket(near?: Coordinates | null): string {
  if (!near) return '';
  return `${near.lat.toFixed(2)},${near.lng.toFixed(2)}`;
}

export const placeKeys = {
  all: [QUERY_SCOPES.places] as const,
  autocomplete: (term: string, near?: Coordinates | null) =>
    [QUERY_SCOPES.places, 'autocomplete', term, nearBucket(near)] as const,
  detail: (placeId: string) => [QUERY_SCOPES.places, 'detail', placeId] as const,
};
