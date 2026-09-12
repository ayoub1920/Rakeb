import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadows, spacing } from '@/theme';

export type BottomPanelProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * A panel docked to the bottom of the screen, over other content — rounded
 * top corners, a shadow cast upward, and safe-area-aware bottom padding.
 *
 * Extracted from the taxi ride-request and active-ride sheets, which each
 * hand-rolled the same `Platform.select` shadow and `Math.max(insets.bottom,
 * spacing.md)` padding; also replaces the flat, unrounded, unshadowed panel on
 * the taxi driver's ride screen, which visibly broke the family.
 */
export function BottomPanel({ children, style }: BottomPanelProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, spacing.md) }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background.default,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadows.panelTop,
  },
});
