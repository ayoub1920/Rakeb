import { QUERY_SCOPES } from '@/api/query-keys';

/** Query keys owned by the support feature. */
export const supportKeys = {
  all: [QUERY_SCOPES.support] as const,
  articles: () => [QUERY_SCOPES.support, 'articles'] as const,
  article: (slug: string) => [QUERY_SCOPES.support, 'article', slug] as const,
};
