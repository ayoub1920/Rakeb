import type { Id } from '@/types/models';

/**
 * Map primitives, expressed independently of any map SDK.
 *
 * Features must import from here and never from `react-native-maps` directly.
 * The provider is expected to change — Google Maps needs an API key and
 * billing, and an OSM-based provider is a live option for Tunisia — and that
 * change must not reach into feature code.
 */

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type MapRegion = Coordinate & {
  latitudeDelta: number;
  longitudeDelta: number;
};

export type MapMarkerKind = 'origin' | 'destination' | 'stop' | 'driver' | 'pickup';

export type MapMarker = {
  id: Id;
  coordinate: Coordinate;
  kind: MapMarkerKind;
  title?: string;
  description?: string;
};

export type MapPolyline = {
  id: Id;
  coordinates: Coordinate[];
  /** Token name from `theme.colors`, resolved by the map component. */
  color?: string;
  width?: number;
};

export type MapViewport = {
  region: MapRegion;
  markers: MapMarker[];
  polylines: MapPolyline[];
};
