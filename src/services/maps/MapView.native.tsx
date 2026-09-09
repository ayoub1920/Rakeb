import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import NativeMapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { DEFAULT_MAP_REGION } from '@/config/constants';
import { colors, radius } from '@/theme';

import { mapAdapter } from './map-adapter';
import { MapPlaceholder } from './MapPlaceholder';
import type { Coordinate, MapMarkerKind, MapRegion, RakebMapViewProps } from './types';

export type { RakebMapViewProps } from './types';

/**
 * `RakebMapView` — iOS / Android build, backed by `react-native-maps`.
 *
 * Metro resolves this file on native and `MapView.tsx` (the placeholder) on
 * web. Prop-compatible with `MapPlaceholder`, so screens import
 * `@/services/maps/MapView` once and never touch `react-native-maps`.
 */
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
  const resolvedRegion = useMemo<MapRegion>(() => {
    if (region) return region;
    const points: Coordinate[] = [
      ...markers.map((marker) => marker.coordinate),
      ...polylines.flatMap((line) => line.coordinates),
    ];
    return points.length > 0 ? mapAdapter.regionForCoordinates(points) : { ...DEFAULT_MAP_REGION };
  }, [region, markers, polylines]);

  if (!mapAdapter.isAvailable()) {
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
      <NativeMapView
        style={StyleSheet.absoluteFill}
        // Android renders Google tiles by default; iOS uses Apple Maps unless a
        // dev build supplies a Google key. Both need no key in Expo Go.
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={resolvedRegion}
        region={region}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={false}
        onRegionChangeComplete={
          onRegionChangeComplete
            ? (next) =>
                onRegionChangeComplete({
                  latitude: next.latitude,
                  longitude: next.longitude,
                  latitudeDelta: next.latitudeDelta,
                  longitudeDelta: next.longitudeDelta,
                })
            : undefined
        }
        onPress={onPress ? (event) => onPress(event.nativeEvent.coordinate as Coordinate) : undefined}
      >
        {polylines.map((line) => (
          <Polyline
            key={line.id}
            coordinates={line.coordinates}
            strokeWidth={line.width ?? 4}
            strokeColor={resolvePolylineColor(line.color)}
          />
        ))}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            pinColor={MARKER_COLORS[marker.kind]}
          />
        ))}
      </NativeMapView>
      {children}
    </View>
  );
}

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
