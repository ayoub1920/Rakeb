import { useCallback, useState } from 'react';

import { locationService } from '@/services/location/location-service';
import type { Coordinates } from '@/types/models';
import { createLogger } from '@/utils/logger';

const log = createLogger('nearby-location');

export type NearbyLocationState = 'idle' | 'locating' | 'ready' | 'denied' | 'unavailable';

export type UseNearbyLocation = {
  state: NearbyLocationState;
  /** The resolved position, or `null` until `state === 'ready'`. */
  coords: Coordinates | null;
  /** Prompts for permission if needed, then reads a position. Call from a press handler. */
  enable: () => Promise<void>;
};

/**
 * The location gate for "trajets près de vous".
 *
 * Permission is requested only when `enable()` is called — never on mount — so
 * the home screen never triggers a cold permission prompt. The last known
 * position is tried first (instant) and a fresh fix is the fallback.
 */
export function useNearbyLocation(): UseNearbyLocation {
  const [state, setState] = useState<NearbyLocationState>('idle');
  const [coords, setCoords] = useState<Coordinates | null>(null);

  const enable = useCallback(async () => {
    setState('locating');
    try {
      const permission = await locationService.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        return;
      }

      const position =
        (await locationService.getLastKnownPosition()) ??
        (await locationService.getCurrentPosition());

      if (!position) {
        setState('unavailable');
        return;
      }

      setCoords(position);
      setState('ready');
    } catch (error) {
      log.warn('Failed to resolve a nearby position', error);
      setState('unavailable');
    }
  }, []);

  return { state, coords, enable };
}
