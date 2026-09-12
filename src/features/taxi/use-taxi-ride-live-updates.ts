import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { env } from '@/config/env';
import { socketService } from '@/services/socket/socket-service';
import { createLogger } from '@/utils/logger';

import { taxiRideKeys } from './keys';
import type { TaxiRide, TaxiRideStatus, TaxiTracking } from './types';

const NS = '/ws/taxi' as const;
const log = createLogger('taxi.ws');

/**
 * Live layer for one ride — `rakeb-backend`'s `TaxiGateway` (`/ws/taxi`).
 * Structural copy of `features/carpool/tracking/use-trip-live-updates.ts`:
 * joins `taxi_ride:{id}`, folds `position`/`eta_updated`/`ride_status` into
 * the same caches `useTaxiRide`/`useTaxiRideTracking` fill over HTTP. Purely
 * additive — the poll stays the source of truth, so a dropped socket only
 * makes updates slower, never stale or wrong.
 */
export function useTaxiRideLiveUpdates(rideId: string | undefined) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!rideId) return;
    // Mock mode is an Axios adapter and cannot serve a websocket; the polls
    // in useTaxiRide/useTaxiRideTracking carry the screen there.
    if (env.enableMockApi) return;

    const trackingKey = taxiRideKeys.tracking(rideId);
    const patchTracking = (next: Partial<TaxiTracking>) =>
      queryClient.setQueryData<TaxiTracking>(trackingKey, (current) =>
        current ? { ...current, ...next } : current,
      );

    const rideKey = taxiRideKeys.detail(rideId);
    const patchRide = (next: Partial<TaxiRide>) =>
      queryClient.setQueryData<TaxiRide>(rideKey, (current) =>
        current ? { ...current, ...next } : current,
      );

    socketService.connect(NS);
    socketService.emit(NS, 'join', { ride_id: rideId });

    const poll = setInterval(() => setConnected(socketService.isConnected(NS)), 1_000);

    const offPosition = socketService.on(NS, 'position', (event) => {
      if (event.ride_id !== rideId) return;
      patchTracking({
        position: {
          lat: event.lat,
          lng: event.lng,
          heading: event.heading,
          speed: event.speed,
          recorded_at: event.recorded_at,
        },
        live: true,
      });
    });

    const offEta = socketService.on(NS, 'eta_updated', (event) => {
      if (event.ride_id !== rideId) return;
      patchTracking({
        eta_at: event.eta_at,
        remaining_distance_m: event.remaining_distance_m,
        traffic: event.traffic as TaxiTracking['traffic'],
      });
    });

    const offStatus = socketService.on(NS, 'ride_status', (event) => {
      if (event.ride_id !== rideId) return;
      const status = event.status as TaxiRideStatus;
      patchRide({ status });
      patchTracking({ status });
      if (status === 'trip_completed' || status === 'cancelled') {
        patchTracking({ live: false });
      }
      // The lists and the quote/dispatch pool are both affected by a status
      // change (a completed/cancelled ride frees the driver, a newly-taken
      // ride disappears from another driver's `available` poll).
      void queryClient.invalidateQueries({ queryKey: taxiRideKeys.all });
    });

    const offError = socketService.on(NS, 'error', (err) => {
      log.warn(`gateway error: ${err.code} ${err.message}`);
    });

    return () => {
      clearInterval(poll);
      offPosition();
      offEta();
      offStatus();
      offError();
      socketService.emit(NS, 'leave', { ride_id: rideId });
      socketService.disconnect(NS);
      setConnected(false);
    };
  }, [rideId, queryClient]);

  return { connected };
}
