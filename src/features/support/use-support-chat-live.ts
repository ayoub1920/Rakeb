import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { env } from '@/config/env';
import { socketService } from '@/services/socket/socket-service';
import { createLogger } from '@/utils/logger';

import type { SupportChatThread, SupportMessage } from './chat-api';
import { supportKeys } from './keys';

const NS = '/ws/support' as const;
const log = createLogger('support.ws');

/**
 * Live layer for the support thread — `rakeb-backend`'s `SupportChatGateway`.
 *
 * Opens `/ws/support` (the gateway auto-joins the user's single thread) and
 * folds incoming `message` events into the same React Query cache the HTTP
 * path writes, deduped by id. Purely additive: `useSupportChat` keeps polling,
 * so a dropped socket only slows the thread, never breaks it.
 */
export function useSupportChatLive(conversationId: string | undefined, active: boolean) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [staffTyping, setStaffTyping] = useState(false);
  const typingResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active || env.enableMockApi) return;

    socketService.connect(NS);
    if (conversationId) socketService.emit(NS, 'join', { conversation_id: conversationId });

    const poll = setInterval(() => setConnected(socketService.isConnected(NS)), 1_000);

    const offMessage = socketService.on(NS, 'message', (dto: SupportMessage) => {
      if (conversationId && dto.conversation_id !== conversationId) return;

      queryClient.setQueryData<SupportChatThread>(supportKeys.chat(), (thread) => {
        if (!thread) return thread;
        if (thread.messages.some((m) => m.id === dto.id)) return thread;
        const withoutTmp = thread.messages.filter(
          (m) => !(m.id.startsWith('tmp_') && m.sender_role === 'user' && m.body === dto.body),
        );
        return {
          ...thread,
          conversation: {
            ...thread.conversation,
            last_message: dto,
            last_message_at: dto.created_at,
            // A staff reply arriving while the sheet is closed bumps the badge;
            // the sheet calls `markRead` on open to clear it.
            unread_count:
              dto.sender_role === 'user'
                ? thread.conversation.unread_count
                : thread.conversation.unread_count + 1,
          },
          messages: [...withoutTmp, dto],
        };
      });
    });

    const offTyping = socketService.on(NS, 'typing', (payload) => {
      if (!payload.is_staff) return;
      setStaffTyping(payload.is_typing);
      if (typingResetRef.current) clearTimeout(typingResetRef.current);
      if (payload.is_typing) {
        typingResetRef.current = setTimeout(() => setStaffTyping(false), 6_000);
      }
    });

    const offError = socketService.on(NS, 'error', (err) => {
      log.warn(`gateway error: ${err.code} ${err.message}`);
    });

    return () => {
      clearInterval(poll);
      if (typingResetRef.current) clearTimeout(typingResetRef.current);
      offMessage();
      offTyping();
      offError();
      if (conversationId) socketService.emit(NS, 'leave', { conversation_id: conversationId });
      socketService.disconnect(NS);
      setConnected(false);
      setStaffTyping(false);
    };
  }, [conversationId, active, queryClient]);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!conversationId) return;
      socketService.emit(NS, 'typing', { conversation_id: conversationId, is_typing: isTyping });
    },
    [conversationId],
  );

  return { connected, staffTyping, sendTyping };
}
