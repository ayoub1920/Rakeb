import { QUERY_SCOPES } from '@/api/query-keys';

/** Query keys owned by the trips feature (the read model). */
export const tripKeys = {
  all: [QUERY_SCOPES.trips] as const,
  detail: (tripId: string) => [QUERY_SCOPES.trips, 'detail', tripId] as const,
  seatMap: (tripId: string) => [QUERY_SCOPES.trips, 'seat-map', tripId] as const,
  myTrips: (status?: string) => [QUERY_SCOPES.trips, 'mine', status ?? 'all'] as const,
};
