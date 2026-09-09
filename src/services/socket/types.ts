import type { MessageResponse, NotificationResponse } from '@/types/api-responses';
import type { Id, IsoDateTime } from '@/types/models';

/**
 * Socket event contracts — verified against `rakeb-backend`'s
 * `ConversationsGateway` (`/ws/conversations`), `TrackingGateway` (`/ws/trips`)
 * and `NotificationsGateway` (`/ws/notifications`). Each namespace is a separate
 * Socket.IO connection.
 *
 * Handshake auth is `auth: { token }` (a bearer access token). Passing
 * `auth.conversation_id` / `auth.trip_id` auto-joins the room on connect;
 * otherwise the client emits `join`. `/ws/notifications` needs no join — the
 * room is the authenticated user.
 */

export type SocketNamespace = '/ws/conversations' | '/ws/trips' | '/ws/notifications';

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export type SocketError = { code: string; message: string };

// --- /ws/conversations -------------------------------------------------

export type ConversationServerEvents = {
  /** The wire `MessageResponse`; map with `toMessage` before it hits the cache. */
  message: MessageResponse;
  read: { user_id: Id; read_at: IsoDateTime };
  typing: { user_id: Id; is_typing: boolean };
  error: SocketError;
};

export type ConversationClientEvents = {
  join: { conversation_id: Id };
  leave: { conversation_id: Id };
  'message:send': { conversation_id: Id; body: string };
  typing: { conversation_id: Id; is_typing: boolean };
};

// --- /ws/trips -------------------------------------------------------

export type TripServerEvents = {
  position: {
    trip_id: Id;
    lat: number;
    lng: number;
    heading: number | null;
    speed: number | null;
    recorded_at: IsoDateTime;
  };
  eta_updated: {
    trip_id: Id;
    eta_at: IsoDateTime | null;
    remaining_distance_m: number | null;
    traffic: string;
  };
  trip_started: { trip_id: Id; started_at: IsoDateTime };
  trip_completed: { trip_id: Id; completed_at: IsoDateTime };
  error: SocketError;
};

export type TripClientEvents = {
  join: { trip_id: Id };
  leave: { trip_id: Id };
  'driver:position': {
    trip_id: Id;
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
  };
};

// --- /ws/notifications ----------------------------------------------

export type NotificationServerEvents = {
  /** A new in-app notification row; fold into the feed cache. */
  notification: NotificationResponse;
  /** Authoritative unread total; drives the bell badge. */
  unread_count: { unread_count: number };
  error: SocketError;
};

/** The room is the authenticated user — nothing for the client to send. */
export type NotificationClientEvents = Record<string, never>;

// --- namespace → event maps -----------------------------------------

export type NamespaceEventMap = {
  '/ws/conversations': {
    server: ConversationServerEvents;
    client: ConversationClientEvents;
  };
  '/ws/trips': {
    server: TripServerEvents;
    client: TripClientEvents;
  };
  '/ws/notifications': {
    server: NotificationServerEvents;
    client: NotificationClientEvents;
  };
};

export type ServerEventName<N extends SocketNamespace> = keyof NamespaceEventMap[N]['server'] &
  string;
export type ClientEventName<N extends SocketNamespace> = keyof NamespaceEventMap[N]['client'] &
  string;

export type ServerEventPayload<
  N extends SocketNamespace,
  E extends ServerEventName<N>,
> = NamespaceEventMap[N]['server'][E];

export type ClientEventPayload<
  N extends SocketNamespace,
  E extends ClientEventName<N>,
> = NamespaceEventMap[N]['client'][E];

export type ServerEventListener<
  N extends SocketNamespace,
  E extends ServerEventName<N>,
> = (payload: ServerEventPayload<N, E>) => void;

/** Removes the listener it was returned from. */
export type Unsubscribe = () => void;
