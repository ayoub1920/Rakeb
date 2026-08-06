import type { Id, IsoDateTime } from '@/types/models';

/**
 * Socket event contracts.
 *
 * `API Rakeb.md` names the trip channel events (`position`, `eta_updated`,
 * `trip_started`, `trip_completed`) but not the conversation ones — those are
 * assumed here and flagged as open question 4 in
 * `docs/API_FRONTEND_ANALYSIS.md`. Confirm against the Nest gateway before
 * building the chat screen.
 */

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

/** Events the server pushes to the client. */
export type ServerEvents = {
  position: {
    trip_id: Id;
    lat: number;
    lng: number;
    heading?: number;
    at: IsoDateTime;
  };
  eta_updated: {
    trip_id: Id;
    eta_minutes: number;
  };
  trip_started: { trip_id: Id; at: IsoDateTime };
  trip_completed: { trip_id: Id; at: IsoDateTime };

  message: {
    conversation_id: Id;
    id: Id;
    author_id: Id;
    body: string;
    created_at: IsoDateTime;
  };
  typing: { conversation_id: Id; user_id: Id; is_typing: boolean };
  read: { conversation_id: Id; user_id: Id; at: IsoDateTime };
};

export type ServerEventName = keyof ServerEvents;

/**
 * Events the client emits.
 *
 * The API documents channels as paths (`/ws/trips/{id}`). Socket.IO rooms are
 * assumed to be joined with these events rather than by opening one connection
 * per trip — a single multiplexed connection is why `joinTrip` / `leaveTrip`
 * exist at all.
 */
export type ClientEvents = {
  join_trip: { trip_id: Id };
  leave_trip: { trip_id: Id };
  join_conversation: { conversation_id: Id };
  leave_conversation: { conversation_id: Id };
  typing: { conversation_id: Id; is_typing: boolean };
};

export type ClientEventName = keyof ClientEvents;

export type ServerEventListener<E extends ServerEventName> = (payload: ServerEvents[E]) => void;

/** Removes the listener it was returned from. */
export type Unsubscribe = () => void;
