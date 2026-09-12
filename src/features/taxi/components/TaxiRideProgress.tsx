import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components';
import { colors, spacing } from '@/theme';

import { RIDE_PROGRESS_ORDER } from '../ride-status';
import type { TaxiRideStatus } from '../types';

const STEP_LABEL: Record<(typeof RIDE_PROGRESS_ORDER)[number], string> = {
  driver_assigned: 'Trouvé',
  driver_arriving: 'En route',
  driver_arrived: 'Arrivé',
  trip_started: 'En course',
  trip_completed: 'Terminé',
};

/** Horizontal step rail for the passenger ride screen — dots + connecting bars. */
export function TaxiRideProgress({ status }: { status: TaxiRideStatus }) {
  const currentIndex = (RIDE_PROGRESS_ORDER as readonly TaxiRideStatus[]).indexOf(status);
  // `searching`, `cancelled`, `expired` have no place on the rail — the caller
  // shows a different state for those instead of rendering this component.
  if (currentIndex < 0) return null;

  return (
    <View style={styles.row}>
      {RIDE_PROGRESS_ORDER.map((step, index) => {
        const reached = index <= currentIndex;
        return (
          <View key={step} style={styles.step}>
            <View style={styles.dotRow}>
              {index > 0 ? (
                <View style={[styles.bar, reached && styles.barReached]} />
              ) : (
                <View style={styles.barSpacer} />
              )}
              <View style={[styles.dot, reached && styles.dotReached]} />
            </View>
            <AppText
              variant="caption"
              color={reached ? 'primary' : 'tertiary'}
              align="center"
              style={styles.label}
            >
              {STEP_LABEL[step]}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const DOT_SIZE = 12;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  step: {
    flex: 1,
    alignItems: 'center',
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  bar: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border.default,
  },
  barReached: {
    backgroundColor: colors.brand.primary,
  },
  barSpacer: {
    flex: 1,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.border.strong,
  },
  dotReached: {
    backgroundColor: colors.brand.primary,
  },
  label: {
    marginTop: spacing.xxs,
  },
});
