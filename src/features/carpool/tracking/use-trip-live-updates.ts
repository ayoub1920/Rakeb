import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { env } from '@/config/env';
import { socketService } from '@/services/socket/socket-service';
import type { TripTracking } from '@/types/models';
import { createLogger } from '@/utils/logger';

import { trackingKeys } from './keys';

const NS = '/ws/trips' as const;
const log = createLogger('tracking.ws');

/**
 * Live layer for one trip's tracking screen — `rakeb-backend`'s
 * `TrackingGateway` (`/ws/trips`).
 *
 * On mount it opens the namespace, joins `trip:{id}`, and folds `position` /
 * `eta_updated` / `trip_started` / `trip_completed` events straight into the
 * same React Query cache `useTripTracking` fills from `GET /trips/{id}/tracking`.
 *
 * Purely additive: the HTTP poll in `useTripTracking` stays the source of
 * truth, so a dropped socket only makes the position update slower, never
 * stale or wrong. Mirrors `features/carpool/conversations/use-live-updates.ts`.
 */
export function useTripLiveUpdates(tripId: string | undefined) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!tripId) return;
    // Mock mode is an Axios adapter and cannot serve a websocket; the poll
    // in `useTripTracking` carries the screen there.
    if (env.enableMockApi) return;

    const key = trackingKeys.trip(tripId);
    const patch = (next: Partial<TripTracking>) =>
      queryClient.setQueryData<TripTracking>(key, (current) =>
        current ? { ...current, ...next } : current,
      );

    socketService.connect(NS);
    socketService.emit(NS, 'join', { trip_id: tripId });

    const poll = setInterval(() => setConnected(socketService.isConnected(NS)), 1_000);

    const offPosition = socketService.on(NS, 'position', (event) => {
      if (event.trip_id !== tripId) return;
      patch({ driver_location: { lat: event.lat, lng: event.lng }, live: true });
    });

    const offEta = socketService.on(NS, 'eta_updated', (event) => {
      if (event.trip_id !== tripId) return;
      patch({
        eta_minutes: event.eta_at
          ? Math.max(0, Math.round((new Date(event.eta_at).getTime() - Date.now()) / 60_000))
          : null,
        traffic: event.traffic,
      });
    });

    const offStarted = socketService.on(NS, 'trip_started', (event) => {
      if (event.trip_id !== tripId) return;
      patch({ state: 'in_progress' });
    });

    const offCompleted = socketService.on(NS, 'trip_completed', (event) => {
      if (event.trip_id !== tripId) return;
      patch({ state: 'completed', live: false });
    });

    const offError = socketService.on(NS, 'error', (err) => {
      log.warn(`gateway error: ${err.code} ${err.message}`);
    });

    return () => {
      clearInterval(poll);
      offPosition();
      offEta();
      offStarted();
      offCompleted();
      offError();
      socketService.emit(NS, 'leave', { trip_id: tripId });
      socketService.disconnect(NS);
      setConnected(false);
    };
  }, [tripId, queryClient]);

  return { connected };
}
