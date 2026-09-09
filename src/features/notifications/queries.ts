import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import { getNextCursor, INITIAL_CURSOR } from '@/api/pagination';
import { STALE_TIME } from '@/api/query-client';
import { useIsAuthenticated } from '@/auth/use-auth';
import type { ApiError, CursorPage } from '@/types/api';
import type { Notification } from '@/types/models';

import {
  getNotificationSettings,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationSettings,
  type NotificationSettings,
} from './api';
import { notificationKeys } from './keys';

type FeedPages = InfiniteData<CursorPage<Notification>>;

/**
 * `GET /me/notifications`.
 *
 * `refetchOnMount` is on: rows are created by the backend in response to other
 * users' actions, so returning to the screen must re-read rather than trust the
 * cache.
 */
export function useNotifications(unreadOnly = false) {
  const isAuthenticated = useIsAuthenticated();

  return useInfiniteQuery<CursorPage<Notification>, ApiError>({
    queryKey: notificationKeys.feed(unreadOnly),
    queryFn: ({ pageParam, signal }) =>
      getNotifications({ unreadOnly, cursor: pageParam as string | null }, { signal }),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: getNextCursor,
    enabled: isAuthenticated,
    staleTime: STALE_TIME.volatile,
    refetchOnMount: 'always',
  });
}

/**
 * `GET /me/notifications/unread-count` — the bell badge.
 *
 * The `/ws/notifications` socket (`useNotificationLiveUpdates`) is the fast
 * path; this poll is the fallback for when it is down.
 */
export function useUnreadCount() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<number, ApiError>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: ({ signal }) => getUnreadCount({ signal }),
    enabled: isAuthenticated,
    staleTime: STALE_TIME.volatile,
    refetchInterval: 60_000,
  });
}

/** Flips `read_at` on a row in every cached feed page. */
function markReadInCache(pages: FeedPages | undefined, id: string, at: string): FeedPages | undefined {
  if (!pages) return pages;
  return {
    ...pages,
    pages: pages.pages.map((page) => ({
      ...page,
      items: page.items.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: at } : n)),
    })),
  };
}

/**
 * `POST /me/notifications/{id}/read`.
 *
 * Optimistic: the row is flipped and the badge decremented immediately, rolled
 * back if the request fails.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    ApiError,
    string,
    { feeds: [readonly unknown[], FeedPages | undefined][]; count: number | undefined }
  >({
    mutationFn: (id) => markNotificationRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const feeds = queryClient.getQueriesData<FeedPages>({
        queryKey: [notificationKeys.all[0], 'feed'],
      });
      const now = new Date().toISOString();
      let wasUnread = false;
      for (const [key, pages] of feeds) {
        if (pages?.pages.some((p) => p.items.some((n) => n.id === id && !n.read_at))) {
          wasUnread = true;
        }
        queryClient.setQueryData(key, markReadInCache(pages, id, now));
      }
      const count = queryClient.getQueryData<number>(notificationKeys.unreadCount());
      if (wasUnread && typeof count === 'number') {
        queryClient.setQueryData(notificationKeys.unreadCount(), Math.max(0, count - 1));
      }
      return { feeds, count };
    },
    onError: (_e, _id, ctx) => {
      ctx?.feeds.forEach(([key, pages]) => queryClient.setQueryData(key, pages));
      if (ctx && typeof ctx.count === 'number') {
        queryClient.setQueryData(notificationKeys.unreadCount(), ctx.count);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

/** `POST /me/notifications/read-all`. */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation<number, ApiError, void>({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.setQueryData(notificationKeys.unreadCount(), 0);
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// --- Per-event preferences ---------------------------------------------

export function useNotificationSettings() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<NotificationSettings, ApiError>({
    queryKey: notificationKeys.settings(),
    queryFn: ({ signal }) => getNotificationSettings({ signal }),
    enabled: isAuthenticated,
    staleTime: STALE_TIME.session,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation<NotificationSettings, ApiError, NotificationSettings>({
    mutationFn: (settings) => updateNotificationSettings(settings),
    onSuccess: (settings) => {
      queryClient.setQueryData(notificationKeys.settings(), settings);
    },
  });
}
