import { Platform } from 'react-native';

import { regionForCoordinates } from './map-adapter';
import type { MapAdapter } from './map-adapter';
import type { Coordinate } from './types';

/**
 * The `react-native-maps` implementation of `MapAdapter`.
 *
 * `react-native-maps` is bundled with Expo Go, so the map renders without a
 * build step — Android draws Google tiles (Expo's shared key), iOS draws Apple
 * Maps. A **custom** Google Maps key only takes effect in a development build;
 * see `app.config.ts` and `docs/` for that path.
 *
 * `isAvailable()` is false on web: `react-native-maps` has a web shim, but the
 * `MapPlaceholder` fallback is the intended experience there and keeps screens
 * off any web-map edge cases.
 *
 * Route geometry from `rakeb-backend` arrives as a GeoJSON `LineString`
 * (`{ coordinates: [lng, lat][] }`), already decoded server-side. `decodePolyline`
 * is kept for the rare case a raw Google encoded polyline reaches the client.
 */

/** Google "encoded polyline" (precision 5) → coordinates. */
export function decodePolyline(encoded: string, precision = 5): Coordinate[] {
  const factor = 10 ** precision;
  const points: Coordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / factor, longitude: lng / factor });
  }

  return points;
}

export const googleMapAdapter: MapAdapter = {
  name: 'react-native-maps',
  isAvailable: () => Platform.OS !== 'web',
  regionForCoordinates,
  decodePolyline,
};
