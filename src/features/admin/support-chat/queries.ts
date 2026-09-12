import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';

import { getNextCursor, INITIAL_CURSOR } from '@/api/pagination';
import { STALE_TIME } from '@/api/query-client';
import { useIsAuthenticated } from '@/auth/use-auth';
import { useIsAdmin } from '@/features/profile/queries';
import type { SupportChatStatus, SupportMessage } from '@/features/support/chat-api';
import { socketService } from '@/services/socket/socket-service';
import type { ApiError, CursorPage } from '@/types/api';

import {
  getSupportChat,
  getSupportChatMessages,
  listSupportChats,
  markSupportChatRead,
  replySupportChat,
  resolveSupportChat,
  type AdminSupportConversation,
} from './api';
import { adminSupportChatKeys } from './keys';

const NS = '/ws/support' as const;

/** Both hooks always run (no short-circuit) so hook order stays stable. */
function useStaffEnabled(): boolean {
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  return isAuthenticated && isAdmin;
}

export function useAdminSupportChats(status?: SupportChatStatus) {
  const enabled = useStaffEnabled();
  return useInfiniteQuery<CursorPage<AdminSupportConversation>, ApiError>({
    queryKey: adminSupportChatKeys.list(status),
    queryFn: ({ pageParam, signal }) =>
      listSupportChats(status, pageParam as string | null, { signal }),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: getNextCursor,
    enabled,
    staleTime: STALE_TIME.volatile,
    refetchInterval: 15_000,
  });
}

export function useAdminSupportChat(id: string) {
  const enabled = useStaffEnabled() && Boolean(id);
  return useQuery<AdminSupportConversation, ApiError>({
    queryKey: adminSupportChatKeys.detail(id),
    queryFn: ({ signal }) => getSupportChat(id, { signal }),
    enabled,
    staleTime: STALE_TIME.volatile,
  });
}

export function useAdminSupportMessages(id: string) {
  const enabled = useStaffEnabled() && Boolean(id);
  return useQuery<SupportMessage[], ApiError>({
    queryKey: adminSupportChatKeys.messages(id),
    queryFn: async ({ signal }) => {
      const page = await getSupportChatMessages(id, null, { signal });
      // API returns newest-first; a transcript reads oldest-first.
      return [...page.items].reverse();
    },
    enabled,
    refetchInterval: 12_000,
    staleTime: 4_000,
  });
}

export function useReplySupportChat(id: string) {
  const queryClient = useQueryClient();
  return useMutation<SupportMessage, ApiError, string>({
    mutationFn: (body) => replySupportChat(id, body),
    onSuccess: (message) => {
      queryClient.setQueryData<SupportMessage[]>(adminSupportChatKeys.messages(id), (rows) =>
        rows && !rows.some((m) => m.id === message.id) ? [...rows, message] : rows,
      );
      void queryClient.invalidateQueries({ queryKey: adminSupportChatKeys.all });
    },
  });
}

export function useResolveSupportChat(id: string) {
  const queryClient = useQueryClient();
  return useMutation<AdminSupportConversation, ApiError, void>({
    mutationFn: () => resolveSupportChat(id),
    onSuccess: (conversation) => {
      queryClient.setQueryData(adminSupportChatKeys.detail(id), conversation);
      void queryClient.invalidateQueries({ queryKey: adminSupportChatKeys.all });
      void queryClient.invalidateQueries({ queryKey: adminSupportChatKeys.messages(id) });
    },
  });
}

export function useMarkAdminSupportRead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markSupportChatRead(id),
    onSuccess: () => {
      queryClient.setQueryData<AdminSupportConversation>(
        adminSupportChatKeys.detail(id),
        (c) => (c ? { ...c, unread_count: 0 } : c),
      );
      void queryClient.invalidateQueries({ queryKey: adminSupportChatKeys.all });
    },
  });
}

/**
 * Live layer for the admin console. Joins `/ws/support`, folds `message`
 * events for the open thread into its cache and re-fetches the queue on any
 * `conversation:activity`.
 */
export function useAdminSupportLive(openConversationId?: string) {
  const queryClient = useQueryClient();
  const enabled = useStaffEnabled();

  useEffect(() => {
    if (!enabled) return;
    socketService.connect(NS);
    if (openConversationId) {
      socketService.emit(NS, 'join', { conversation_id: openConversationId });
    }

    const offMessage = socketService.on(NS, 'message', (dto: SupportMessage) => {
      queryClient.setQueryData<SupportMessage[]>(
        adminSupportChatKeys.messages(dto.conversation_id),
        (rows) => (rows && !rows.some((m) => m.id === dto.id) ? [...rows, dto] : rows),
      );
    });
    const offActivity = socketService.on(NS, 'conversation:activity', () => {
      void queryClient.invalidateQueries({ queryKey: adminSupportChatKeys.list() });
    });

    return () => {
      offMessage();
      offActivity();
      if (openConversationId) {
        socketService.emit(NS, 'leave', { conversation_id: openConversationId });
      }
      socketService.disconnect(NS);
    };
  }, [enabled, openConversationId, queryClient]);
}
