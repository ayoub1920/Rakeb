import { QUERY_SCOPES } from '@/api/query-keys';

/** Query keys owned by the conversations feature. */
export const conversationKeys = {
  all: [QUERY_SCOPES.conversations] as const,
  list: () => [QUERY_SCOPES.conversations, 'list'] as const,
  messages: (conversationId: string) =>
    [QUERY_SCOPES.conversations, 'messages', conversationId] as const,
  quickReplies: () => [QUERY_SCOPES.conversations, 'quick-replies'] as const,
};
