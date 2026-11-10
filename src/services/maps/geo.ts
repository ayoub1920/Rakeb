import { DEFAULT_MAP_REGION } from '@/config/constants';
import type { Coordinates, Place } from '@/types/models';

import type { Coordinate, MapMarker, MapRegion } from './types';

/**
 * Pure, provider-independent geo helpers.
 *
 * Split out of `map-adapter.ts` so that file's adapter contract can import
 * `google-map-adapter.ts` (for the default export swap) without that adapter
 * needing to import back from `map-adapter.ts` — which was a require cycle.
 */

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
