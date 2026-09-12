import { useCallback, useState } from 'react';

import { locationService } from '@/services/location/location-service';
import type { Coordinates } from '@/types/models';
import { createLogger } from '@/utils/logger';

const log = createLogger('taxi.pickup-location');

export type TaxiPickupLocationState = 'idle' | 'locating' | 'ready' | 'denied' | 'unavailable';

export type UseTaxiPickupLocation = {
  state: TaxiPickupLocationState;
  coords: Coordinates | null;
  /** Prompts for permission if needed, then reads a position. Call from a press handler only. */
  locate: () => Promise<void>;
};

/**
 * The location gate for the taxi passenger search screen — structural copy
 * of `features/carpool/search/use-nearby-location.ts`. Permission is
 * requested only when `locate()` is called, never on mount, so opening the
 * search screen never triggers a cold permission prompt on its own.
 *
 * Returns raw coordinates only; the screen composes this with
 * `useReverseGeocode()` (from `@/features/places/queries`) to turn them into
 * a labelled `Place` for `useTaxiRideStore.setPickup()`.
 */
export function useTaxiPickupLocation(): UseTaxiPickupLocation {
  const [state, setState] = useState<TaxiPickupLocationState>('idle');
  const [coords, setCoords] = useState<Coordinates | null>(null);

  const locate = useCallback(async () => {
    setState('locating');
    try {
      const permission = await locationService.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        return;
      }

      const position =
        (await locationService.getCurrentPosition()) ??
        (await locationService.getLastKnownPosition());

      if (!position) {
        setState('unavailable');
        return;
      }

      setCoords(position);
      setState('ready');
    } catch (error) {
      log.warn('Failed to resolve the current position', error);
      setState('unavailable');
    }
  }, []);

  return { state, coords, locate };
}
