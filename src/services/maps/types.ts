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

/**
 * Props for `RakebMapView`.
 *
 * Kept here (not in `MapView.tsx`) because the component has a platform split —
 * `MapView.tsx` (web / fallback) and `MapView.native.tsx` (`react-native-maps`)
 * — and both must share one prop contract. `react-native-maps` pulls in
 * native-only modules, so it must never reach the web bundle.
 */
export type RakebMapViewProps = {
  region?: MapRegion;
  markers?: MapMarker[];
  polylines?: MapPolyline[];
  /** Height in points for a fixed strip. Omit and pass `style` for a flexible fill. */
  height?: number;
  style?: import('react-native').ViewStyle;
  /** Draw the blue "you are here" dot. Requires location permission already granted. */
  showsUserLocation?: boolean;
  /** Fires after the user pans/zooms — used by the "choose on the map" picker. */
  onRegionChangeComplete?: (region: MapRegion) => void;
  /** Tap anywhere on the map. */
  onPress?: (coordinate: Coordinate) => void;
  /** Extra overlay content (a centre pin, a floating button). */
  children?: import('react').ReactNode;
  /** Disable gestures — a non-interactive preview strip. */
  interactive?: boolean;
  testID?: string;
};
