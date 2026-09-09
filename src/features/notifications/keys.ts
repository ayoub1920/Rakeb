import { QUERY_SCOPES } from '@/api/query-keys';

/** Query keys owned by the notifications feature. */
export const notificationKeys = {
  all: [QUERY_SCOPES.notifications] as const,
  feed: (unreadOnly: boolean) => [QUERY_SCOPES.notifications, 'feed', { unreadOnly }] as const,
  unreadCount: () => [QUERY_SCOPES.notifications, 'unread-count'] as const,
  settings: () => [QUERY_SCOPES.notifications, 'settings'] as const,
};
