import { QUERY_SCOPES } from '@/api/query-keys';

/** Query keys owned by the services feature. */
export const serviceKeys = {
  all: [QUERY_SCOPES.services] as const,
  catalogue: () => [QUERY_SCOPES.services, 'catalogue'] as const,
  appConfig: () => [QUERY_SCOPES.appConfig] as const,
};
