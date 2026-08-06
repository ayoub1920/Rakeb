import { DEFAULT_MAP_REGION } from '@/config/constants';
import type { Coordinates, Place } from '@/types/models';

import type { Coordinate, MapMarker, MapPolyline, MapRegion } from './types';

/**
 * The contract a map provider must satisfy.
 *
 * Only the pure helpers are implemented — they are provider independent and
 * useful today (fitting a region around a set of points, converting API
 * coordinates). The rendering side lives in `MapPlaceholder` until a real
 * provider is chosen.
 *
 * To implement it with `react-native-maps`: add `src/services/maps/google-map-adapter.ts`,
 * satisfy this interface, and swap the export at the bottom of this file. No
 * feature imports change.
 */
export interface MapAdapter {
  readonly name: string;
  /** Whether the underlying SDK is configured (API key present, etc.). */
  isAvailable(): boolean;
  /** A region containing every coordinate, with padding. */
  regionForCoordinates(coordinates: Coordinate[]): MapRegion;
  /** Decodes an encoded polyline from the routing API into coordinates. */
  decodePolyline(encoded: string): Coordinate[];
}

/** `{ lat, lng }` from the API → `{ latitude, longitude }` for map SDKs. */
export function toCoordinate(value: Coordinates): Coordinate {
  return { latitude: value.lat, longitude: value.lng };
}

export function placeToMarker(place: Place, kind: MapMarker['kind']): MapMarker {
  return {
    id: place.id,
    coordinate: toCoordinate(place),
    kind,
    title: place.label,
    description: place.governorate,
  };
}

/** Padding applied around the tightest bounding box, as a fraction of its span. */
const REGION_PADDING = 0.25;
const MIN_DELTA = 0.02;

export function regionForCoordinates(coordinates: Coordinate[]): MapRegion {
  if (coordinates.length === 0) return { ...DEFAULT_MAP_REGION };

  const latitudes = coordinates.map((point) => point.latitude);
  const longitudes = coordinates.map((point) => point.longitude);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(MIN_DELTA, (maxLat - minLat) * (1 + REGION_PADDING)),
    longitudeDelta: Math.max(MIN_DELTA, (maxLng - minLng) * (1 + REGION_PADDING)),
  };
}

/**
 * The adapter in use.
 *
 * `isAvailable()` returns false and `decodePolyline` throws: no provider is
 * wired yet, and a silent empty result would look like a routing bug rather
 * than an unimplemented feature.
 */
export const mapAdapter: MapAdapter = {
  name: 'not-implemented',
  isAvailable: () => false,
  regionForCoordinates,
  decodePolyline: () => {
    throw new Error(
      'No map provider configured. Implement MapAdapter in src/services/maps and swap the export.',
    );
  },
};

export type { Coordinate, MapMarker, MapPolyline, MapRegion };
