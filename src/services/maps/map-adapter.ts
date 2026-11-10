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

// Pure helpers live in `./geo` (no adapter dependency) so `google-map-adapter.ts`
// can reuse `regionForCoordinates` without importing back from this file.
export { toCoordinate, placeToMarker, regionForCoordinates } from './geo';

/**
 * The adapter in use: `react-native-maps` (see `./google-map-adapter`).
 *
 * `isAvailable()` is true on iOS/Android where the native module loads and
 * false on web, so map screens fall back to `MapPlaceholder` there rather than
 * crashing the bundle.
 */
export { googleMapAdapter as mapAdapter } from './google-map-adapter';

export type { Coordinate, MapMarker, MapPolyline, MapRegion };
