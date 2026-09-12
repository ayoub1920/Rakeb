import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useIsAuthenticated } from '@/auth/use-auth';
import type { ApiError } from '@/types/api';

import {
  getSupportChat,
  markSupportChatRead,
  sendSupportMessage,
  type SupportChatThread,
  type SupportMessage,
} from './chat-api';
import { supportKeys } from './keys';

const POLL_MS = 20_000;

/** `GET /support/chat` — the user's thread plus its latest messages. */
export function useSupportChat(options?: { enabled?: boolean }) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery<SupportChatThread, ApiError>({
    queryKey: supportKeys.chat(),
    queryFn: ({ signal }) => getSupportChat({ signal }),
    enabled: isAuthenticated && options?.enabled !== false,
    // The socket carries live updates; this is only a dropped-socket fallback.
    refetchInterval: POLL_MS,
    staleTime: 5_000,
  });
}

/** Unread staff replies — drives the floating button badge. Cheap: reuses the cache. */
export function useSupportUnreadCount(): number {
  const { data } = useSupportChat();
  return data?.conversation.unread_count ?? 0;
}

/** `POST /support/chat/messages` with an optimistic append. */
export function useSendSupportMessage() {
  const queryClient = useQueryClient();

  return useMutation<SupportMessage, ApiError, string, { previous?: SupportChatThread }>({
    mutationFn: (body) => sendSupportMessage(body),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: supportKeys.chat() });
      const previous = queryClient.getQueryData<SupportChatThread>(supportKeys.chat());
      if (previous) {
        const optimistic: SupportMessage = {
          id: `tmp_${Date.now()}`,
          conversation_id: previous.conversation.id,
          sender_id: null,
          sender_role: 'user',
          body: body.trim(),
          created_at: new Date().toISOString(),
        };
        queryClient.setQueryData<SupportChatThread>(supportKeys.chat(), {
          ...previous,
          messages: [...previous.messages, optimistic],
        });
      }
      return { previous };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(supportKeys.chat(), context.previous);
      }
    },
    onSuccess: (message) => {
      queryClient.setQueryData<SupportChatThread>(supportKeys.chat(), (thread) => {
        if (!thread) return thread;
        const withoutTmp = thread.messages.filter(
          (m) => !(m.id.startsWith('tmp_') && m.body === message.body),
        );
        if (withoutTmp.some((m) => m.id === message.id)) {
          return { ...thread, messages: withoutTmp };
        }
        return {
          ...thread,
          conversation: {
            ...thread.conversation,
            status: thread.conversation.status === 'resolved' ? 'open' : thread.conversation.status,
            last_message: message,
            last_message_at: message.created_at,
          },
          messages: [...withoutTmp, message],
        };
      });
    },
  });
}

/** `POST /support/chat/read` — clears the badge once the sheet is open. */
export function useMarkSupportChatRead() {
  const queryClient = useQueryClient();
  return useMutation<{ unread_count: number }, ApiError, void>({
    mutationFn: () => markSupportChatRead(),
    onSuccess: () => {
      queryClient.setQueryData<SupportChatThread>(supportKeys.chat(), (thread) =>
        thread
          ? { ...thread, conversation: { ...thread.conversation, unread_count: 0 } }
          : thread,
      );
    },
  });
}
