import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useEffect } from 'react';

import { QUERY_SCOPES } from '@/api/query-keys';
import { useIsAuthenticated } from '@/auth/use-auth';
import { env } from '@/config/env';
import { socketService } from '@/services/socket/socket-service';
import type { CursorPage } from '@/types/api';
import type { Notification } from '@/types/models';
import { createLogger } from '@/utils/logger';

import { toNotification } from './api';
import { notificationKeys } from './keys';

const NS = '/ws/notifications' as const;
const log = createLogger('notifications.ws');

type FeedPages = InfiniteData<CursorPage<Notification>>;

/**
 * App-wide live layer for the notification bell — `rakeb-backend`'s
 * `NotificationsGateway`.
 *
 * Mounted once (see `NotificationLiveUpdates`). Folds incoming `notification`
 * events into the same feed cache the HTTP path writes (dedup by id) and takes
 * the authoritative `unread_count` for the badge. Purely additive: the badge
 * query keeps polling as a fallback, so a dropped socket only makes it slower.
 */
export function useNotificationLiveUpdates() {
  const queryClient = useQueryClient();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    if (!isAuthenticated) return;
    // Mock mode is an Axios adapter — it cannot serve a websocket.
    if (env.enableMockApi) return;

    socketService.connect(NS);

    const offNotification = socketService.on(NS, 'notification', (dto) => {
      const incoming = toNotification(dto);
      const feeds = queryClient.getQueriesData<FeedPages>({
        queryKey: [QUERY_SCOPES.notifications, 'feed'],
      });
      for (const [key, pages] of feeds) {
        if (!pages) continue;
        const alreadyThere = pages.pages.some((p) => p.items.some((n) => n.id === incoming.id));
        if (alreadyThere) continue;
        // The "unread only" feed must not receive an already-read row, but a
        // fresh notification is unread by definition.
        const [first, ...rest] = pages.pages;
        queryClient.setQueryData<FeedPages>(key, {
          ...pages,
          pages: [{ ...first!, items: [incoming, ...first!.items] }, ...rest],
        });
      }
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    });

    const offCount = socketService.on(NS, 'unread_count', ({ unread_count }) => {
      queryClient.setQueryData(notificationKeys.unreadCount(), unread_count);
    });

    const offError = socketService.on(NS, 'error', (err) => {
      log.warn(`gateway error: ${err.code} ${err.message}`);
    });

    return () => {
      offNotification();
      offCount();
      offError();
      socketService.disconnect(NS);
    };
  }, [isAuthenticated, queryClient]);
}
