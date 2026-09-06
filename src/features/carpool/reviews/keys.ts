import { QUERY_SCOPES } from '@/api/query-keys';

/** Query keys owned by the reviews feature. */
export const reviewKeys = {
  all: [QUERY_SCOPES.reviews] as const,
  tags: () => [QUERY_SCOPES.reviews, 'tags'] as const,
  pending: () => [QUERY_SCOPES.reviews, 'pending'] as const,
};
