import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, sizes, spacing } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

export type PlaceFieldsProps = {
  originLabel: string | null;
  originPlaceholder?: string;
  onPressOrigin: () => void;
  destinationLabel: string | null;
  destinationPlaceholder?: string;
  onPressDestination: () => void;
  /** Renders a swap button between the two fields when set. */
  onSwap?: () => void;
};

/**
 * The origin/destination field pair: a filled-dot marker for the origin, a
 * filled-square marker for the destination, on a tinted surface with a
 * hairline divider between them.
 *
 * Taxi's most recognisable motif (`RideRequestSheet`'s pickup/destination
 * rows), promoted here so carpool's search form and place-picker use the same
 * origin/destination language instead of a plain caption-and-value pair.
 */
export function PlaceFields({
  originLabel,
  originPlaceholder = 'Point de départ',
  onPressOrigin,
  destinationLabel,
  destinationPlaceholder = 'Destination',
  onPressDestination,
  onSwap,
}: PlaceFieldsProps) {
  return (
    <View style={styles.row}>
      <View style={styles.column}>
        <PlaceField
          icon="ellipse"
          iconColor="brand"
          placeholder={originPlaceholder}
          value={originLabel}
          onPress={onPressOrigin}
        />
        <View style={styles.divider} />
        <PlaceField
          icon="square"
          iconColor="accent"
          placeholder={destinationPlaceholder}
          value={destinationLabel}
          onPress={onPressDestination}
        />
      </View>

      {onSwap ? (
        <IconButton
          name="swap-vertical"
          size="sm"
          onPress={onSwap}
          accessibilityLabel="Inverser le départ et la destination"
        />
      ) : null}
    </View>
  );
}

function PlaceField({
  icon,
  iconColor,
  placeholder,
  value,
  onPress,
}: {
  icon: 'ellipse' | 'square';
  iconColor: 'brand' | 'accent';
  placeholder: string;
  value: string | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ?? placeholder}
      style={styles.fieldRow}
    >
      <Icon name={icon} size="xs" color={iconColor} />
      <AppText variant="body" color={value ? 'primary' : 'tertiary'} numberOfLines={1} style={styles.fieldText}>
        {value ?? placeholder}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  column: {
    flex: 1,
    backgroundColor: colors.background.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.input.height,
  },
  fieldText: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
  },
});
