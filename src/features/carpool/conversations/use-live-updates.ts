import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { env } from '@/config/env';
import { useCurrentUser } from '@/features/profile/queries';
import { socketService } from '@/services/socket/socket-service';
import type { CursorPage } from '@/types/api';
import type { Message } from '@/types/models';
import { createLogger } from '@/utils/logger';

import { toMessage } from './api';
import { conversationKeys } from './keys';

const NS = '/ws/conversations' as const;
const log = createLogger('conversations.ws');

type Pages = InfiniteData<CursorPage<Message>>;

/**
 * Live layer for one conversation thread — `rakeb-backend`'s
 * `ConversationsGateway`.
 *
 * On mount it opens `/ws/conversations`, joins the room, and folds incoming
 * `message` events straight into the same React Query cache the HTTP path
 * writes. Dedup is by message id, so a message the sender already rendered
 * optimistically (or already got back from `POST /messages`) is never doubled
 * when its socket echo arrives.
 *
 * It is purely additive: `useMessages` keeps polling as a fallback, so a
 * dropped socket only makes the thread slower, never stale.
 */
export function useConversationLiveUpdates(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const { data: me } = useCurrentUser();
  const meId = me?.id ?? '';

  const [connected, setConnected] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const typingResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!conversationId || !meId) return;
    // Mock mode is an Axios adapter — it cannot serve a websocket. The
    // polling fallback in `useMessages` carries the thread there.
    if (env.enableMockApi) return;

    const key = [...conversationKeys.messages(conversationId), meId] as const;
    socketService.connect(NS);
    socketService.emit(NS, 'join', { conversation_id: conversationId });

    const poll = setInterval(() => setConnected(socketService.isConnected(NS)), 1_000);

    const offMessage = socketService.on(NS, 'message', (dto) => {
      if (dto.conversation_id !== conversationId) return;
      const incoming = toMessage(dto, meId);

      queryClient.setQueryData<Pages>(key, (data) => {
        if (!data) {
          return { pageParams: [null], pages: [{ items: [incoming], next_cursor: null }] };
        }
        const alreadyThere = data.pages.some((p) => p.items.some((m) => m.id === incoming.id));
        if (alreadyThere) return data;

        const [first, ...rest] = data.pages;
        // Replace a still-pending optimistic row for the same outgoing message
        // if its echo beat the HTTP response; otherwise prepend.
        const withoutOptimistic = first!.items.filter(
          (m) => !(m.id.startsWith('tmp_') && m.author === 'me' && m.body === incoming.body),
        );
        return {
          ...data,
          pages: [{ ...first!, items: [incoming, ...withoutOptimistic] }, ...rest],
        };
      });

      void queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    });

    const offRead = socketService.on(NS, 'read', () => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    });

    const offTyping = socketService.on(NS, 'typing', (payload) => {
      if (payload.user_id === meId) return;
      setPeerTyping(payload.is_typing);
      if (typingResetRef.current) clearTimeout(typingResetRef.current);
      if (payload.is_typing) {
        // Safety net in case the "stopped" event is lost.
        typingResetRef.current = setTimeout(() => setPeerTyping(false), 6_000);
      }
    });

    const offError = socketService.on(NS, 'error', (err) => {
      log.warn(`gateway error: ${err.code} ${err.message}`);
    });

    return () => {
      clearInterval(poll);
      if (typingResetRef.current) clearTimeout(typingResetRef.current);
      offMessage();
      offRead();
      offTyping();
      offError();
      socketService.emit(NS, 'leave', { conversation_id: conversationId });
      socketService.disconnect(NS);
      setConnected(false);
      setPeerTyping(false);
    };
  }, [conversationId, meId, queryClient]);

  /** Tells the other participant we're typing (or stopped). No-op when disconnected. */
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!conversationId) return;
      socketService.emit(NS, 'typing', { conversation_id: conversationId, is_typing: isTyping });
    },
    [conversationId],
  );

  return { connected, peerTyping, sendTyping };
}
