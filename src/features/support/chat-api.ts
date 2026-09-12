import { apiGet, apiPost } from '@/api/request';
import type { RequestOptions } from '@/types/api';

/**
 * Live support chat — the signed-in user's real-time thread with the staff
 * team. Backend: `rakeb-backend/src/modules/support` (`/v1/support/chat*`,
 * `/ws/support`). Distinct from the carpool rider↔driver conversations.
 */

export type SupportChatStatus = 'open' | 'active' | 'resolved';
export type SupportSenderRole = 'user' | 'staff' | 'system';

export type SupportMessage = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_role: SupportSenderRole;
  body: string;
  created_at: string;
};

export type SupportConversation = {
  id: string;
  status: SupportChatStatus;
  subject: string | null;
  unread_count: number;
  last_message: SupportMessage | null;
  last_message_at: string | null;
  created_at: string;
};

export type SupportChatThread = {
  conversation: SupportConversation;
  messages: SupportMessage[];
};

export function getSupportChat(options?: RequestOptions): Promise<SupportChatThread> {
  return apiGet<SupportChatThread>('/support/chat', undefined, options);
}

export function sendSupportMessage(body: string, options?: RequestOptions): Promise<SupportMessage> {
  return apiPost<SupportMessage>('/support/chat/messages', { body }, options);
}

export function markSupportChatRead(
  options?: RequestOptions,
): Promise<{ unread_count: number; read_at: string }> {
  return apiPost<{ unread_count: number; read_at: string }>(
    '/support/chat/read',
    undefined,
    options,
  );
}
