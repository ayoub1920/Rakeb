import { io, type Socket } from 'socket.io-client';

import { env } from '@/config/env';
import { getAccessToken } from '@/stores/auth-store';
import { createLogger } from '@/utils/logger';

import type {
  ClientEventName,
  ClientEvents,
  ServerEventListener,
  ServerEventName,
  SocketStatus,
  Unsubscribe,
} from './types';

/**
 * Typed Socket.IO wrapper for trip tracking and conversations.
 *
 * Two rules it enforces:
 *
 *  1. **It never connects on its own.** `connect()` is called by the screen
 *     that needs live data and `disconnect()` when that screen unmounts.
 *     A socket held open for the whole session drains the battery and keeps a
 *     server connection alive for a user who is reading their profile.
 *
 *  2. **Sockets are an enhancement, never the source of truth.** The API
 *     documents `GET /trips/{id}/tracking` as a polling fallback, so every
 *     tracking screen must render correctly with the socket disconnected.
 *
 * Nothing here is wired to a screen yet. The transport is real; the
 * subscriptions are not.
 */

const log = createLogger('socket');

export interface RakebSocketService {
  getStatus(): SocketStatus;
  isConnected(): boolean;
  /** Opens the connection. Idempotent. Auth token is read from the auth store. */
  connect(): void;
  disconnect(): void;

  joinTrip(tripId: string): void;
  leaveTrip(tripId: string): void;
  joinConversation(conversationId: string): void;
  leaveConversation(conversationId: string): void;

  /** Subscribes to a server event; the returned function unsubscribes. */
  on<E extends ServerEventName>(event: E, listener: ServerEventListener<E>): Unsubscribe;
  off<E extends ServerEventName>(event: E, listener: ServerEventListener<E>): void;
  emit<E extends ClientEventName>(event: E, payload: ClientEvents[E]): void;
}

/**
 * A structural view of the socket with plain string event names.
 *
 * socket.io types `on`/`emit` through a conditional that cannot be resolved
 * against a generic event name, so the cast is confined here. The public
 * `RakebSocketService` API above stays fully typed — this is the only place in
 * the app where event names are untyped strings.
 */
type RawSocket = {
  on(event: string, listener: (payload: never) => void): void;
  off(event: string, listener: (payload: never) => void): void;
  emit(event: string, payload: unknown): void;
};

class SocketService implements RakebSocketService {
  private socket: Socket | null = null;
  private status: SocketStatus = 'idle';

  private get raw(): RawSocket | null {
    return this.socket as unknown as RawSocket | null;
  }

  getStatus(): SocketStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  connect(): void {
    if (this.socket) {
      if (!this.socket.connected) this.socket.connect();
      return;
    }

    this.status = 'connecting';
    this.socket = io(env.wsUrl, {
      // Explicit connection only — see the class comment.
      autoConnect: false,
      transports: ['websocket'],
      // Handshake auth. The Nest gateway's expected shape is unconfirmed
      // (open question 3 in docs/API_FRONTEND_ANALYSIS.md).
      auth: { token: getAccessToken() },
      reconnectionAttempts: 5,
      reconnectionDelay: 1_000,
    });

    this.socket.on('connect', () => {
      this.status = 'connected';
      log.info('Connected.');
    });
    this.socket.on('disconnect', (reason) => {
      this.status = 'disconnected';
      log.info(`Disconnected: ${reason}`);
    });
    this.socket.on('connect_error', (error) => {
      this.status = 'error';
      log.warn('Connection error', error.message);
    });

    this.socket.connect();
  }

  disconnect(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.status = 'idle';
  }

  joinTrip(tripId: string): void {
    this.emit('join_trip', { trip_id: tripId });
  }

  leaveTrip(tripId: string): void {
    this.emit('leave_trip', { trip_id: tripId });
  }

  joinConversation(conversationId: string): void {
    this.emit('join_conversation', { conversation_id: conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.emit('leave_conversation', { conversation_id: conversationId });
  }

  on<E extends ServerEventName>(event: E, listener: ServerEventListener<E>): Unsubscribe {
    this.raw?.on(event, listener as (payload: never) => void);
    return () => this.off(event, listener);
  }

  off<E extends ServerEventName>(event: E, listener: ServerEventListener<E>): void {
    this.raw?.off(event, listener as (payload: never) => void);
  }

  emit<E extends ClientEventName>(event: E, payload: ClientEvents[E]): void {
    if (!this.socket?.connected) {
      log.debug(`Dropped "${event}" — socket is not connected.`);
      return;
    }
    this.raw?.emit(event, payload);
  }
}

/** Single shared connection, multiplexed across trips and conversations. */
export const socketService: RakebSocketService = new SocketService();
