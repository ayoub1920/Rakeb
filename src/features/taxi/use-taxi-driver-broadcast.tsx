import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { env } from '@/config/env';
import { locationService } from '@/services/location/location-service';
import { createLogger } from '@/utils/logger';

import { pushTaxiDriverLocation } from './api';

const log = createLogger('taxi.driver.broadcast');

/**
 * Driver's location uplink while online — structural copy of
 * `features/carpool/tracking/use-driver-position-broadcast.ts`, but keyed on
 * "is this driver online" rather than "is this specific trip in progress":
 * a taxi driver must be discoverable *before* any ride exists, not just
 * during one.
 *
 * Always calls `locationService.watchPosition()` (never `expo-location`
 * directly) — that's what carries the SDK 57 web-watch-teardown fix
 * automatically. Every ping goes through `POST /me/taxi/location`, which the
 * backend fans out to the Redis live key + `/ws/taxi` broadcast on its own
 * when the driver turns out to be engaged on a ride — this hook does not
 * need to know a ride id.
 *
 * Meant to be mounted once, high up (`src/app/taxi/driver/_layout.tsx`), so
 * it keeps running across navigation from "go online" to an active ride
 * screen — a per-screen mount would stop broadcasting the moment the driver
 * navigates to the ride they just accepted.
 */
export type TaxiBroadcastStatus = {
  /** A `watchPosition` subscription is active and pinging the backend. */
  sharing: boolean;
  /** The user was asked and said no (or had already said no before). */
  permissionDenied: boolean;
  /** At least one position has been sent since this mount. */
  hasFix: boolean;
  /** Re-run the permission check/request — e.g. after the user opens Settings. */
  retryPermission: () => void;
};

export function useTaxiDriverBroadcast(enabled: boolean): TaxiBroadcastStatus {
  const [sharing, setSharing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [hasFix, setHasFix] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const lastSentAt = useRef(0);

  useEffect(() => {
    if (!enabled || env.enableMockApi) return;

    let stop: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      let permission = await locationService.getPermissionStatus();
      if (permission !== 'granted') {
        permission = await locationService.requestPermission();
      }
      if (cancelled) return;

      if (permission !== 'granted') {
        log.warn('location permission denied; not broadcasting');
        setPermissionDenied(true);
        setSharing(false);
        return;
      }
      setPermissionDenied(false);

      setSharing(true);
      stop = await locationService.watchPosition(
        (sample) => {
          const now = Date.now();
          if (now - lastSentAt.current < 8_000) return;
          lastSentAt.current = now;

          void pushTaxiDriverLocation({
            lat: sample.lat,
            lng: sample.lng,
            heading: sample.heading ?? undefined,
            speed: sample.speed ?? undefined,
            accuracy: sample.accuracy ?? undefined,
          })
            .then(() => setHasFix(true))
            .catch((error) => log.warn(`position POST failed: ${String(error)}`));
        },
        { minIntervalMs: 8_000, minDistanceM: 40 },
      );
    })();

    return () => {
      cancelled = true;
      stop?.();
      setSharing(false);
      setPermissionDenied(false);
      setHasFix(false);
    };
  }, [enabled, retryToken]);

  return { sharing, permissionDenied, hasFix, retryPermission: () => setRetryToken((n) => n + 1) };
}

/**
 * Shares the single layout-level `useTaxiDriverBroadcast` mount with any
 * screen underneath (`online.tsx`) — the hook itself must stay mounted once
 * at `driver/_layout.tsx` (see docblock above), so screens read its status
 * through context instead of calling the hook a second time, which would
 * start a second, redundant `watchPosition` subscription.
 */
const TaxiBroadcastContext = createContext<TaxiBroadcastStatus | null>(null);

export function TaxiBroadcastProvider({
  value,
  children,
}: {
  value: TaxiBroadcastStatus;
  children: ReactNode;
}) {
  return <TaxiBroadcastContext.Provider value={value}>{children}</TaxiBroadcastContext.Provider>;
}

/** Falls back to an all-off status if read outside the provider (e.g. in tests). */
export function useTaxiBroadcastStatus(): TaxiBroadcastStatus {
  return (
    useContext(TaxiBroadcastContext) ?? {
      sharing: false,
      permissionDenied: false,
      hasFix: false,
      retryPermission: () => undefined,
    }
  );
}
