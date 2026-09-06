import { QUERY_SCOPES } from '@/api/query-keys';

/** Query keys owned by the tracking feature. */
export const trackingKeys = {
  all: [QUERY_SCOPES.tracking] as const,
  trip: (tripId: string) => [QUERY_SCOPES.tracking, 'trip', tripId] as const,
};
