import { QUERY_SCOPES } from '@/api/query-keys';

export const taxiApplicationKeys = {
  all: [QUERY_SCOPES.taxiApplication] as const,
  mine: () => [QUERY_SCOPES.taxiApplication, 'mine'] as const,
};

export const taxiRideKeys = {
  all: [QUERY_SCOPES.taxiRides] as const,
  list: (role: 'rider' | 'driver', status?: string) =>
    [QUERY_SCOPES.taxiRides, 'list', role, status ?? 'all'] as const,
  detail: (rideId: string) => [QUERY_SCOPES.taxiRides, 'detail', rideId] as const,
  tracking: (rideId: string) => [QUERY_SCOPES.taxiRides, 'tracking', rideId] as const,
};

export const taxiQuoteKeys = {
  all: [QUERY_SCOPES.taxiQuote] as const,
};

export const taxiDispatchKeys = {
  all: [QUERY_SCOPES.taxiDispatch] as const,
  available: () => [QUERY_SCOPES.taxiDispatch, 'available'] as const,
};
