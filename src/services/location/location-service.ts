import * as Location from 'expo-location';

import type { Coordinates } from '@/types/models';
import { createLogger } from '@/utils/logger';

/**
 * Device location.
 *
 * Permission is **never** requested at startup. It is requested at the moment
 * the user asks for something that needs it ("trajets près de moi", picking a
 * pickup point) — a cold permission prompt on first launch is the single
 * biggest cause of permanent denials.
 *
 * `POST /me/location` (opt-in last known position) is not wired: sending a
 * user's position to the server is a product and privacy decision, not a
 * scaffold one.
 */

const log = createLogger('location');

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface LocationService {
  /** Reads the current permission without prompting. */
  getPermissionStatus(): Promise<LocationPermissionStatus>;
  /** Prompts if undetermined. Call this from a user action, never on mount. */
  requestPermission(): Promise<LocationPermissionStatus>;
  /** Last known position — fast, may be stale, `null` if never located. */
  getLastKnownPosition(): Promise<Coordinates | null>;
  /** Fresh fix. Slower and powered by the GPS radio. */
  getCurrentPosition(): Promise<Coordinates | null>;
}

function toStatus(response: Location.LocationPermissionResponse): LocationPermissionStatus {
  if (response.granted) return 'granted';
  return response.canAskAgain ? 'undetermined' : 'denied';
}

function toCoordinates(position: Location.LocationObject | null): Coordinates | null {
  if (!position) return null;
  return { lat: position.coords.latitude, lng: position.coords.longitude };
}

export const locationService: LocationService = {
  async getPermissionStatus() {
    return toStatus(await Location.getForegroundPermissionsAsync());
  },

  async requestPermission() {
    return toStatus(await Location.requestForegroundPermissionsAsync());
  },

  async getLastKnownPosition() {
    try {
      return toCoordinates(await Location.getLastKnownPositionAsync());
    } catch (error) {
      log.warn('Failed to read the last known position', error);
      return null;
    }
  },

  async getCurrentPosition() {
    try {
      return toCoordinates(
        await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      );
    } catch (error) {
      log.warn('Failed to read the current position', error);
      return null;
    }
  },
};
