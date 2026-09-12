import { QUERY_SCOPES } from '@/api/query-keys';

/** Query keys owned by the admin support-chat console. */
export const adminSupportChatKeys = {
  all: [QUERY_SCOPES.adminSupportChat] as const,
  list: (status?: string) => [QUERY_SCOPES.adminSupportChat, 'list', status ?? 'all'] as const,
  detail: (id: string) => [QUERY_SCOPES.adminSupportChat, 'detail', id] as const,
  messages: (id: string) => [QUERY_SCOPES.adminSupportChat, 'messages', id] as const,
};
