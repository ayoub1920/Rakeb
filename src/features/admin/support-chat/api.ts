import { toCursorParams } from '@/api/pagination';
import { apiGet, apiPost } from '@/api/request';
import type { CursorPage, RequestOptions } from '@/types/api';
import type { PaginatedResponse } from '@/types/api-responses';
import type { SupportChatStatus, SupportMessage } from '@/features/support/chat-api';

/**
 * Staff view of the live support chat — `rakeb-backend`'s
 * `admin-support-chat.controller.ts` (`/v1/admin/support/chats*`). Requires the
 * `admin` or `support` role; the backend enforces it.
 */

export type AdminSupportConversation = {
  id: string;
  status: SupportChatStatus;
  subject: string | null;
  unread_count: number;
  last_message: SupportMessage | null;
  last_message_at: string | null;
  created_at: string;
  user_id: string;
  user_name: string;
  assigned_staff_id: string | null;
};

export async function listSupportChats(
  status: SupportChatStatus | undefined,
  cursor: string | null | undefined,
  options?: RequestOptions,
): Promise<CursorPage<AdminSupportConversation>> {
  const page = await apiGet<PaginatedResponse<AdminSupportConversation>>(
    '/admin/support/chats',
    { ...(status ? { status } : {}), ...toCursorParams(cursor) },
    options,
  );
  return { items: page.items, next_cursor: page.next_cursor, total: page.total };
}

export function getSupportChat(
  id: string,
  options?: RequestOptions,
): Promise<AdminSupportConversation> {
  return apiGet<AdminSupportConversation>(`/admin/support/chats/${id}`, undefined, options);
}

export async function getSupportChatMessages(
  id: string,
  cursor: string | null | undefined,
  options?: RequestOptions,
): Promise<CursorPage<SupportMessage>> {
  const page = await apiGet<PaginatedResponse<SupportMessage>>(
    `/admin/support/chats/${id}/messages`,
    toCursorParams(cursor),
    options,
  );
  return { items: page.items, next_cursor: page.next_cursor, total: page.total };
}

export function replySupportChat(
  id: string,
  body: string,
  options?: RequestOptions,
): Promise<SupportMessage> {
  return apiPost<SupportMessage>(`/admin/support/chats/${id}/messages`, { body }, options);
}

export function resolveSupportChat(
  id: string,
  options?: RequestOptions,
): Promise<AdminSupportConversation> {
  return apiPost<AdminSupportConversation>(`/admin/support/chats/${id}/resolve`, undefined, options);
}

export function markSupportChatRead(
  id: string,
  options?: RequestOptions,
): Promise<{ unread_count: number }> {
  return apiPost<{ unread_count: number }>(`/admin/support/chats/${id}/read`, undefined, options);
}
