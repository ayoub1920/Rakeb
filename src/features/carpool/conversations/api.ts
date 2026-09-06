import { toCursorParams } from '@/api/pagination';
import { apiGet, apiPost } from '@/api/request';
import type { CursorPage, RequestOptions } from '@/types/api';
import type {
  ConversationResponse,
  MessageResponse,
  PaginatedResponse,
  QuickReplyResponse,
} from '@/types/api-responses';
import type { Conversation, Message, QuickReply } from '@/types/models';

/**
 * Passenger ↔ driver messaging — `API Rakeb.md` §9.
 *
 * A conversation is created with the booking; there is no "start a chat" entry
 * point, so there is no create call here.
 *
 * `GET /conversations` returns a bare array (no cursor); the thread history is
 * the paginated one. Message authorship is `me` / `peer`, decided here by
 * comparing `sender_id` against the current user's id.
 */

function toConversation(dto: ConversationResponse): Conversation {
  return {
    id: dto.id,
    trip_id: dto.trip_id,
    peer: {
      id: dto.counterpart?.id ?? '',
      first_name: dto.counterpart?.display_name ?? 'Conducteur',
      avatar_url: dto.counterpart?.avatar_url ?? null,
    },
    trip_label: dto.trip_label,
    last_message: dto.last_message?.body ?? null,
    last_message_at: dto.last_message_at,
    unread_count: dto.unread_count,
  };
}

/** Wire `MessageResponse` → domain `Message`. Exported for the WS live-update handler. */
export function toMessage(dto: MessageResponse, meId: string): Message {
  return {
    id: dto.id,
    author: dto.sender_id && dto.sender_id === meId ? 'me' : 'peer',
    body: dto.body,
    created_at: dto.created_at,
  };
}

/** `GET /conversations` — list with last message and unread count. */
export async function getConversations(options?: RequestOptions): Promise<Conversation[]> {
  const rows = await apiGet<ConversationResponse[]>('/conversations', undefined, options);
  return rows.map(toConversation);
}

/**
 * `GET /conversations/{id}/messages` — history, newest first.
 *
 * The cursor walks toward older messages; the screen renders inverted.
 */
export async function getMessages(
  conversationId: string,
  meId: string,
  cursor?: string | null,
  options?: RequestOptions,
): Promise<CursorPage<Message>> {
  const page = await apiGet<PaginatedResponse<MessageResponse>>(
    `/conversations/${conversationId}/messages`,
    toCursorParams(cursor),
    options,
  );
  return {
    items: page.items.map((dto) => toMessage(dto, meId)),
    next_cursor: page.next_cursor,
    total: page.total,
  };
}

/** `POST /conversations/{id}/messages` — send. Always authored by `me`. */
export async function sendMessage(
  conversationId: string,
  body: string,
  meId: string,
  options?: RequestOptions,
): Promise<Message> {
  const dto = await apiPost<MessageResponse>(
    `/conversations/${conversationId}/messages`,
    { body },
    options,
  );
  return toMessage(dto, meId);
}

/** `GET /conversations/quick-replies` — the canned replies chip row. */
export async function getQuickReplies(options?: RequestOptions): Promise<QuickReply[]> {
  const rows = await apiGet<QuickReplyResponse[]>(
    '/conversations/quick-replies',
    undefined,
    options,
  );
  return rows.map((row) => ({ id: row.code, body: row.label }));
}

/** `POST /conversations/{id}/read` — clears this conversation's unread count. */
export function markConversationRead(
  conversationId: string,
  options?: RequestOptions,
): Promise<{ read_at: string }> {
  return apiPost<{ read_at: string }>(`/conversations/${conversationId}/read`, undefined, options);
}
