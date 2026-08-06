import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { radius, spacing, theme } from '@/theme';

import type { MapMarker, MapPolyline, MapRegion } from './types';

export type MapPlaceholderProps = {
  region?: MapRegion;
  markers?: MapMarker[];
  polylines?: MapPolyline[];
  /** Height in points. Maps are usually either a strip or a full screen. */
  height?: number;
};

/**
 * Stands in for the real map.
 *
 * It takes the same props a `MapView` wrapper will, so screens can be laid out
 * and reviewed before a provider is chosen: replacing this component with one
 * that renders `react-native-maps` changes no call site.
 *
 * It reports what it *would* draw, which makes it useful while wiring the data
 * that feeds a map, not just as a grey box.
 */
export function MapPlaceholder({
  region,
  markers = [],
  polylines = [],
  height = 200,
}: MapPlaceholderProps) {
  return (
    <View
      style={[styles.container, { height }]}
      accessibilityRole="image"
      accessibilityLabel="Carte non disponible dans cette version"
    >
      <AppText variant="label" color="development">
        Carte — non implémentée
      </AppText>
      <AppText variant="caption" color="secondary" style={styles.detail}>
        {markers.length} marqueur(s) · {polylines.length} tracé(s)
        {region ? ` · ${region.latitude.toFixed(3)}, ${region.longitude.toFixed(3)}` : ''}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 3,
    borderStyle: 'dashed',
    borderColor: theme.colors.development.border,
    backgroundColor: theme.colors.development.surface,
    padding: spacing.lg,
  },
  detail: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
