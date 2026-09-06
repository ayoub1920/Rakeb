import { QUERY_SCOPES } from '@/api/query-keys';

/** Query keys owned by the publishing feature (the driver side). */
export const publishingKeys = {
  all: [QUERY_SCOPES.publishing] as const,
  priceSuggestion: (from: string, to: string, date: string) =>
    [QUERY_SCOPES.publishing, 'price-suggestion', from, to, date] as const,
  myTrips: (status: string) => [QUERY_SCOPES.publishing, 'my-trips', status] as const,
  requests: (tripId: string | null, status: string) =>
    [QUERY_SCOPES.publishing, 'requests', tripId ?? 'all', status] as const,
};
