import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';

export type StepIndicatorProps = {
  /** 1-based current step. */
  step: number;
  /** Total number of steps. */
  total: number;
};

/**
 * « Étape N sur M » plus a progress bar. Used at the top of every multi-step
 * flow so the user always knows where they are and how much is left.
 */
export function StepIndicator({ step, total }: StepIndicatorProps) {
  const clamped = Math.min(Math.max(step, 1), total);
  const ratio = clamped / total;

  return (
    <View style={styles.container} accessibilityRole="progressbar">
      <AppText variant="caption" color="tertiary">
        Étape {clamped} sur {total}
      </AppText>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  track: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.background.surface,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
  },
});
