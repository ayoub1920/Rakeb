import { QUERY_SCOPES } from '@/api/query-keys';
import type { AdminUsersSearch } from './api';

/** Query keys owned by the admin user-directory feature. */
export const adminUserKeys = {
  all: [QUERY_SCOPES.adminUsers] as const,
  list: (search: AdminUsersSearch) =>
    [QUERY_SCOPES.adminUsers, 'list', search.q ?? '', search.role ?? '', search.status ?? ''] as const,
  detail: (id: string) => [QUERY_SCOPES.adminUsers, 'detail', id] as const,
};
