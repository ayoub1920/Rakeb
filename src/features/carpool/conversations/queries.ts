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
import { useCurrentUser } from '@/features/profile/queries';
import type { ApiError, CursorPage } from '@/types/api';
import type { Conversation, Message, QuickReply } from '@/types/models';

import {
  getConversations,
  getMessages,
  getQuickReplies,
  markConversationRead,
  sendMessage,
} from './api';
import { conversationKeys } from './keys';

/** `GET /conversations` — a bare list, not paginated. Volatile: a new message changes it. */
export function useConversations() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<Conversation[], ApiError>({
    queryKey: conversationKeys.list(),
    queryFn: ({ signal }) => getConversations({ signal }),
    enabled: isAuthenticated,
    staleTime: STALE_TIME.volatile,
    refetchOnMount: 'always',
  });
}

/**
 * `GET /conversations/{id}/messages`.
 *
 * Same infinite-query shape as search, but the list is inverted: page 0 holds
 * the newest messages and `fetchNextPage` walks toward older history. The
 * current user's id decides `me` / `peer` for each row.
 */
export function useMessages(
  conversationId: string | undefined,
  { live = false }: { live?: boolean } = {},
) {
  const { data: me } = useCurrentUser();
  const meId = me?.id ?? '';

  return useInfiniteQuery<CursorPage<Message>, ApiError>({
    queryKey: [...conversationKeys.messages(conversationId ?? ''), meId] as const,
    queryFn: ({ pageParam, signal }) =>
      getMessages(conversationId as string, meId, pageParam as string | null, { signal }),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: getNextCursor,
    enabled: Boolean(conversationId) && Boolean(meId),
    staleTime: STALE_TIME.volatile,
    // The websocket (`useConversationLiveUpdates`) is the fast path. Polling
    // stays on as a fallback — slow while the socket is connected, quicker
    // when it isn't. `refetchIntervalInBackground` stays off.
    refetchInterval: live ? 20_000 : 5_000,
  });
}

/**
 * `POST /conversations/{id}/read`.
 *
 * Fire-and-forget on mount and whenever a new message arrives — it clears the
 * unread badge on the list. A failure is silent: the next open retries it.
 */
export function useMarkConversationRead(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<{ read_at: string }, ApiError, void>({
    mutationFn: () => markConversationRead(conversationId as string),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: conversationKeys.list() }),
  });
}

/** `GET /conversations/quick-replies` — static catalogue data. */
export function useQuickReplies() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<QuickReply[], ApiError>({
    queryKey: conversationKeys.quickReplies(),
    queryFn: ({ signal }) => getQuickReplies({ signal }),
    enabled: isAuthenticated,
    staleTime: STALE_TIME.static,
  });
}

type MessagePages = InfiniteData<CursorPage<Message>>;

/**
 * `POST /conversations/{id}/messages`.
 *
 * Optimistically prepends the sent message to page 0 (the newest page) and
 * reconciles by id on success — the server echo replaces the temporary row
 * rather than duplicating it. On error the optimistic row is rolled back.
 */
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const { data: me } = useCurrentUser();
  const meId = me?.id ?? '';
  const key = [...conversationKeys.messages(conversationId), meId] as const;

  return useMutation<Message, ApiError, string, { previous?: MessagePages; tempId: string }>({
    mutationFn: (body) => sendMessage(conversationId, body, meId),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MessagePages>(key);
      const tempId = `tmp_${Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        author: 'me',
        body,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<MessagePages>(key, (data) => {
        if (!data) {
          return {
            pageParams: [null],
            pages: [{ items: [optimistic], next_cursor: null }],
          };
        }
        const [first, ...rest] = data.pages;
        return {
          ...data,
          pages: [{ ...first!, items: [optimistic, ...first!.items] }, ...rest],
        };
      });

      return { previous, tempId };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: (message, _body, context) => {
      queryClient.setQueryData<MessagePages>(key, (data) => {
        if (!data) return data;
        const seen = new Set<string>();
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            // Swap the optimistic row for the server one, then drop any
            // duplicate id — the websocket echo may have already inserted it.
            items: page.items
              .map((item) => (item.id === context.tempId ? message : item))
              .filter((item) => {
                if (seen.has(item.id)) return false;
                seen.add(item.id);
                return true;
              }),
          })),
        };
      });
      void queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
}
