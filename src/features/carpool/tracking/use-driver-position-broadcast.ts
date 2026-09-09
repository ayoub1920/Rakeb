import { useEffect, useRef, useState } from 'react';

import { env } from '@/config/env';
import { locationService } from '@/services/location/location-service';
import { socketService } from '@/services/socket/socket-service';
import { createLogger } from '@/utils/logger';

import { pushDriverPosition } from './api';

const NS = '/ws/trips' as const;
const log = createLogger('tracking.driver');

/**
 * Driver's location uplink for one active trip.
 *
 * While `enabled` (i.e. the driver's trip is `in_progress` and the screen is
 * focused) it watches the foreground GPS and, at most every ~8 s, both
 * `POST /trips/{id}/position` (the source of truth) and emits `driver:position`
 * on `/ws/trips` (the fast path). No background permission — the watch stops
 * on unmount / blur / when `enabled` goes false.
 *
 * Foreground-only by design: background location needs a config plugin and a
 * dev build, which this Expo Go project does not use.
 */
export function useDriverPositionBroadcast(tripId: string | undefined, enabled: boolean) {
  const [sharing, setSharing] = useState(false);
  const lastSentAt = useRef(0);

  useEffect(() => {
    if (!enabled || !tripId || env.enableMockApi) return;

    let stop: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const permission = await locationService.getPermissionStatus();
      if (permission !== 'granted') {
        const asked = await locationService.requestPermission();
        if (asked !== 'granted') {
          log.warn('location permission denied; not broadcasting');
          return;
        }
      }
      if (cancelled) return;

      socketService.connect(NS);
      socketService.emit(NS, 'join', { trip_id: tripId });
      setSharing(true);

      stop = await locationService.watchPosition(
        (sample) => {
          const now = Date.now();
          if (now - lastSentAt.current < 8_000) return;
          lastSentAt.current = now;

          const payload = {
            trip_id: tripId,
            lat: sample.lat,
            lng: sample.lng,
            heading: sample.heading ?? undefined,
            speed: sample.speed ?? undefined,
            accuracy: sample.accuracy ?? undefined,
          };
          socketService.emit(NS, 'driver:position', payload);
          void pushDriverPosition(tripId, {
            lat: sample.lat,
            lng: sample.lng,
            heading: sample.heading ?? undefined,
            speed: sample.speed ?? undefined,
            accuracy: sample.accuracy ?? undefined,
          }).catch((error) => log.warn(`position POST failed: ${String(error)}`));
        },
        { minIntervalMs: 8_000, minDistanceM: 40 },
      );
    })();

    return () => {
      cancelled = true;
      stop?.();
      setSharing(false);
    };
  }, [tripId, enabled]);

  return { sharing };
}
