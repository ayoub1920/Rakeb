import { QUERY_SCOPES } from '@/api/query-keys';

/** Query keys owned by the profile feature. */
export const profileKeys = {
  all: [QUERY_SCOPES.session] as const,
  currentUser: () => [QUERY_SCOPES.session, 'me'] as const,
  preferences: () => [QUERY_SCOPES.session, 'preferences'] as const,
  verifications: () => [QUERY_SCOPES.session, 'verifications'] as const,
  publicProfile: (userId: string) => [QUERY_SCOPES.session, 'user', userId] as const,
};
