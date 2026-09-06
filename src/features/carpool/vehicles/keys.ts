import { QUERY_SCOPES } from '@/api/query-keys';

/** Query keys owned by the vehicles feature. */
export const vehicleKeys = {
  all: [QUERY_SCOPES.vehicles] as const,
  list: () => [QUERY_SCOPES.vehicles, 'list'] as const,
  detail: (id: string) => [QUERY_SCOPES.vehicles, 'detail', id] as const,
};
