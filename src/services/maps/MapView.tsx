import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DEFAULT_MAP_REGION } from '@/config/constants';
import { env } from '@/config/env';
import { colors, radius } from '@/theme';

import {
  loadGoogleMaps,
  type GoogleMap,
  type GoogleMapObject,
  type GoogleMapsApi,
} from './google-maps-loader';
import { mapAdapter } from './map-adapter';
import { MapPlaceholder } from './MapPlaceholder';
import type { Coordinate, MapMarkerKind, MapRegion, RakebMapViewProps } from './types';

export type { RakebMapViewProps } from './types';

/**
 * `RakebMapView` — web build, backed by the Google Maps **JavaScript API**.
 *
 * Metro resolves this file on web and `MapView.native.tsx` (`react-native-maps`)
 * on iOS / Android, so `react-native-maps` — which pulls in native-only modules
 * and breaks the web bundle — never reaches web. Both files satisfy the same
 * `RakebMapViewProps` contract, so call sites are identical on every platform.
 *
 * With no `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (or if the script fails to load) it
 * degrades to `MapPlaceholder`.
 */

const MARKER_COLORS: Record<MapMarkerKind, string> = {
  origin: colors.brand.primary,
  destination: colors.brand.accent,
  stop: colors.text.tertiary,
  driver: colors.status.info,
  pickup: colors.status.success,
};

function resolvePolylineColor(token: string | undefined): string {
  if (!token) return colors.brand.primary;
  if (token === 'accent') return colors.brand.accent;
  if (token === 'driver') return colors.status.info;
  return token.startsWith('#') ? token : colors.brand.primary;
}

/** `longitudeDelta` (degrees of span) → an approximate Google zoom level. */
function zoomForSpan(longitudeDelta: number): number {
  const zoom = Math.round(Math.log2(360 / Math.max(longitudeDelta, 1e-4)));
  return Math.min(18, Math.max(2, zoom));
}

function regionFromMap(map: GoogleMap): MapRegion | null {
  const bounds = map.getBounds()?.toJSON();
  const center = map.getCenter();
  if (!bounds || !center) return null;
  return {
    latitude: center.lat(),
    longitude: center.lng(),
    latitudeDelta: Math.abs(bounds.north - bounds.south),
    longitudeDelta: Math.abs(bounds.east - bounds.west),
  };
}

type Status = 'loading' | 'ready' | 'error';

export function RakebMapView({
  region,
  markers = [],
  polylines = [],
  height,
  style,
  showsUserLocation = false,
  onRegionChangeComplete,
  onPress,
  children,
  interactive = true,
  testID,
}: RakebMapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const apiRef = useRef<GoogleMapsApi | null>(null);
  const overlaysRef = useRef<GoogleMapObject[]>([]);
  const listenersRef = useRef<unknown[]>([]);
  // `fitBounds` runs once, like a native map's `initialRegion` — otherwise a
  // moving marker (e.g. the live driver on the tracking screen) would re-frame
  // the map on every poll.
  const hasFramedRef = useRef(false);
  const [status, setStatus] = useState<Status>(env.googleMapsApiKey ? 'loading' : 'error');

  const resolvedRegion = useMemo<MapRegion>(() => {
    if (region) return region;
    const points: Coordinate[] = [
      ...markers.map((marker) => marker.coordinate),
      ...polylines.flatMap((line) => line.coordinates),
    ];
    return points.length > 0 ? mapAdapter.regionForCoordinates(points) : { ...DEFAULT_MAP_REGION };
    // Recompute only when the *shape* of the inputs changes, not every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, markers.length, polylines.length]);

  // --- create the map once -------------------------------------------------
  useEffect(() => {
    if (!env.googleMapsApiKey) {
      setStatus('error');
      return;
    }
    let cancelled = false;

    loadGoogleMaps(env.googleMapsApiKey)
      .then((api) => {
        if (cancelled || !containerRef.current) return;
        const map = new api.Map(containerRef.current, {
          center: { lat: resolvedRegion.latitude, lng: resolvedRegion.longitude },
          zoom: zoomForSpan(resolvedRegion.longitudeDelta),
          disableDefaultUI: true,
          zoomControl: interactive,
          gestureHandling: interactive ? 'greedy' : 'none',
          keyboardShortcuts: interactive,
          clickableIcons: false,
        });
        apiRef.current = api;
        mapRef.current = map;

        if (onPress) {
          listenersRef.current.push(
            map.addListener('click', (event) => {
              const lat = event.latLng?.lat();
              const lng = event.latLng?.lng();
              if (lat != null && lng != null) onPress({ latitude: lat, longitude: lng });
            }),
          );
        }
        if (onRegionChangeComplete) {
          listenersRef.current.push(
            map.addListener('idle', () => {
              const next = regionFromMap(map);
              if (next) onRegionChangeComplete(next);
            }),
          );
        }

        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.warn('[RakebMapView] Google Maps failed to initialise:', error);
        setStatus('error');
      });

    return () => {
      cancelled = true;
      const api = apiRef.current;
      listenersRef.current.forEach((handle) => api?.event.removeListener(handle));
      listenersRef.current = [];
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
      mapRef.current = null;
      apiRef.current = null;
    };
    // The map is created once; prop-driven updates happen in the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- follow the `region` prop -----------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (status !== 'ready' || !map || !region) return;
    map.setCenter({ lat: region.latitude, lng: region.longitude });
    map.setZoom(zoomForSpan(region.longitudeDelta));
  }, [status, region]);

  // --- draw markers + polylines ---------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    const api = apiRef.current;
    if (status !== 'ready' || !map || !api) return;

    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];

    polylines.forEach((line) => {
      const overlay = new api.Polyline({
        path: line.coordinates.map((point) => ({ lat: point.latitude, lng: point.longitude })),
        strokeColor: resolvePolylineColor(line.color),
        strokeWeight: line.width ?? 4,
        strokeOpacity: 0.9,
        map,
      });
      overlaysRef.current.push(overlay);
    });

    markers.forEach((marker) => {
      const overlay = new api.Marker({
        position: { lat: marker.coordinate.latitude, lng: marker.coordinate.longitude },
        map,
        title: marker.title,
        icon: {
          path: api.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: MARKER_COLORS[marker.kind],
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });
      overlaysRef.current.push(overlay);
    });

    // Frame the content once when the caller did not pin an explicit region.
    if (!region && !hasFramedRef.current) {
      const bounds = new api.LatLngBounds();
      markers.forEach((marker) =>
        bounds.extend({ lat: marker.coordinate.latitude, lng: marker.coordinate.longitude }),
      );
      polylines.forEach((line) =>
        line.coordinates.forEach((point) =>
          bounds.extend({ lat: point.latitude, lng: point.longitude }),
        ),
      );
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 48);
        hasFramedRef.current = true;
      }
    }
  }, [status, markers, polylines, region]);

  // --- optional "you are here" dot ----------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    const api = apiRef.current;
    if (status !== 'ready' || !map || !api || !showsUserLocation) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    let dot: GoogleMapObject | null = null;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        dot = new api.Marker({
          position: { lat: position.coords.latitude, lng: position.coords.longitude },
          map,
          zIndex: 1000,
          icon: {
            path: api.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: colors.status.info,
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
          },
        });
      },
      undefined,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );

    return () => dot?.setMap(null);
  }, [status, showsUserLocation]);

  if (status === 'error') {
    return (
      <MapPlaceholder
        region={resolvedRegion}
        markers={markers}
        polylines={polylines}
        height={height ?? 200}
      />
    );
  }

  return (
    <View
      style={[styles.container, height != null ? { height } : styles.fill, style]}
      testID={testID}
    >
      {/* react-native-web renders View as a div; the map needs a raw node. */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.background.surface,
  },
  fill: {
    flex: 1,
  },
});
