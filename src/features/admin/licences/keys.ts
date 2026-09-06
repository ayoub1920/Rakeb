import { QUERY_SCOPES } from '@/api/query-keys';
import type { LicenceReviewStatus } from '@/types/models';

/** Query keys owned by the admin licence-review feature. */
export const adminLicenceKeys = {
  all: [QUERY_SCOPES.adminLicences] as const,
  list: (status: LicenceReviewStatus | undefined) =>
    [QUERY_SCOPES.adminLicences, 'list', status ?? 'all'] as const,
  detail: (userId: string) => [QUERY_SCOPES.adminLicences, 'detail', userId] as const,
};
