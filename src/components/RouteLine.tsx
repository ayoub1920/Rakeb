import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { spacing } from '@/theme';

import { AppText, type AppTextProps } from './AppText';
import { Icon } from './Icon';

export type RouteLineProps = {
  originLabel: string;
  destinationLabel: string;
  variant?: AppTextProps['variant'];
  style?: StyleProp<ViewStyle>;
};

/**
 * An origin → destination line, with a real arrow icon between the two
 * places instead of a typed `→` character.
 *
 * Used wherever a trip or booking summarises its route in one line (the home
 * screen's next-trip card, the activity list, trip summary cards); a fuller
 * multi-stop itinerary (dot-and-line, one row per stop) stays in
 * `features/carpool/trips` since it knows the trip's stop list.
 */
export function RouteLine({ originLabel, destinationLabel, variant = 'subheading', style }: RouteLineProps) {
  return (
    <View style={[styles.row, style]}>
      <AppText variant={variant} numberOfLines={1} style={styles.text}>
        {originLabel}
      </AppText>
      <Icon name="arrow-forward" size="sm" color="tertiary" />
      <AppText variant={variant} numberOfLines={1} style={styles.text}>
        {destinationLabel}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    flexShrink: 1,
  },
});
