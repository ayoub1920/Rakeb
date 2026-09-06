import { io, type Socket } from 'socket.io-client';

import { env } from '@/config/env';
import { getAccessToken } from '@/stores/auth-store';
import { createLogger } from '@/utils/logger';

import type {
  ClientEventName,
  ClientEventPayload,
  ServerEventListener,
  ServerEventName,
  SocketNamespace,
  SocketStatus,
  Unsubscribe,
} from './types';

/**
 * Typed Socket.IO wrapper for trip tracking and conversations.
 *
 * Two rules it enforces:
 *
 *  1. **It never connects on its own.** `connect(namespace)` is called by the
 *     screen that needs live data and `disconnect(namespace)` when that screen
 *     unmounts. A socket held open for the whole session drains the battery.
 *
 *  2. **Sockets are an enhancement, never the source of truth.** Every screen
 *     must still render correctly with the socket disconnected — the message
 *     thread and the tracking screen both keep a polling fallback.
 *
 * Each namespace (`/ws/conversations`, `/ws/trips`) is a distinct Socket.IO
 * connection; they are kept in a map and torn down independently.
 */

const log = createLogger('socket');

export interface RakebSocketService {
  getStatus(namespace: SocketNamespace): SocketStatus;
  isConnected(namespace: SocketNamespace): boolean;

  /** Opens the namespace connection. Idempotent. Token is read from the auth store. */
  connect(namespace: SocketNamespace): void;
  disconnect(namespace: SocketNamespace): void;
  /** Tears down every namespace — used on sign-out. */
  disconnectAll(): void;

  /** Subscribes to a server event on a namespace; the returned function unsubscribes. */
  on<N extends SocketNamespace, E extends ServerEventName<N>>(
    namespace: N,
    event: E,
    listener: ServerEventListener<N, E>,
  ): Unsubscribe;
  off<N extends SocketNamespace, E extends ServerEventName<N>>(
    namespace: N,
    event: E,
    listener: ServerEventListener<N, E>,
  ): void;
  emit<N extends SocketNamespace, E extends ClientEventName<N>>(
    namespace: N,
    event: E,
    payload: ClientEventPayload<N, E>,
  ): void;
}

/**
 * socket.io types `on`/`emit` through a conditional that cannot be resolved
 * against a generic event name, so the cast is confined here. The public
 * `RakebSocketService` API above stays fully typed.
 */
type RawSocket = {
  on(event: string, listener: (payload: never) => void): void;
  off(event: string, listener: (payload: never) => void): void;
  emit(event: string, payload: unknown): void;
};

type Entry = { socket: Socket; status: SocketStatus };

class SocketService implements RakebSocketService {
  private readonly entries = new Map<SocketNamespace, Entry>();

  getStatus(namespace: SocketNamespace): SocketStatus {
    return this.entries.get(namespace)?.status ?? 'idle';
  }

  isConnected(namespace: SocketNamespace): boolean {
    return this.entries.get(namespace)?.socket.connected ?? false;
  }

  connect(namespace: SocketNamespace): void {
    const existing = this.entries.get(namespace);
    if (existing) {
      if (!existing.socket.connected) existing.socket.connect();
      return;
    }

    const socket = io(`${env.wsUrl}${namespace}`, {
      autoConnect: false,
      transports: ['websocket'],
      // The gateway's handshake middleware reads `auth.token`.
      auth: { token: getAccessToken() },
      reconnectionAttempts: 5,
      reconnectionDelay: 1_000,
    });

    const entry: Entry = { socket, status: 'connecting' };
    this.entries.set(namespace, entry);

    socket.on('connect', () => {
      entry.status = 'connected';
      log.info(`Connected: ${namespace}`);
    });
    socket.on('disconnect', (reason) => {
      entry.status = 'disconnected';
      log.info(`Disconnected ${namespace}: ${reason}`);
    });
    socket.on('connect_error', (error) => {
      entry.status = 'error';
      log.warn(`Connection error ${namespace}`, error.message);
    });

    socket.connect();
  }

  disconnect(namespace: SocketNamespace): void {
    const entry = this.entries.get(namespace);
    if (!entry) return;
    entry.socket.removeAllListeners();
    entry.socket.disconnect();
    this.entries.delete(namespace);
  }

  disconnectAll(): void {
    for (const namespace of [...this.entries.keys()]) this.disconnect(namespace);
  }

  on<N extends SocketNamespace, E extends ServerEventName<N>>(
    namespace: N,
    event: E,
    listener: ServerEventListener<N, E>,
  ): Unsubscribe {
    this.raw(namespace)?.on(event, listener as (payload: never) => void);
    return () => this.off(namespace, event, listener);
  }

  off<N extends SocketNamespace, E extends ServerEventName<N>>(
    namespace: N,
    event: E,
    listener: ServerEventListener<N, E>,
  ): void {
    this.raw(namespace)?.off(event, listener as (payload: never) => void);
  }

  emit<N extends SocketNamespace, E extends ClientEventName<N>>(
    namespace: N,
    event: E,
    payload: ClientEventPayload<N, E>,
  ): void {
    const entry = this.entries.get(namespace);
    if (!entry?.socket.connected) {
      log.debug(`Dropped "${event}" on ${namespace} — not connected.`);
      return;
    }
    this.raw(namespace)?.emit(event, payload);
  }

  private raw(namespace: SocketNamespace): RawSocket | null {
    return (this.entries.get(namespace)?.socket as unknown as RawSocket | undefined) ?? null;
  }
}

/** Single shared service; one Socket.IO connection per namespace. */
export const socketService: RakebSocketService = new SocketService();
