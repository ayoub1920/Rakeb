import { QUERY_SCOPES } from '@/api/query-keys';

export const adminTaxiKeys = {
  all: [QUERY_SCOPES.adminTaxi] as const,
  applications: (status?: string) => [QUERY_SCOPES.adminTaxi, 'applications', status ?? 'all'] as const,
  application: (userId: string) => [QUERY_SCOPES.adminTaxi, 'application', userId] as const,
  rides: (status?: string) => [QUERY_SCOPES.adminTaxi, 'rides', status ?? 'all'] as const,
  ride: (rideId: string) => [QUERY_SCOPES.adminTaxi, 'ride', rideId] as const,
};
