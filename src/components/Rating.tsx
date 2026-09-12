import { Pressable, StyleSheet, View } from 'react-native';

import { sizes, spacing } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconSize } from './Icon';

export type RatingProps = {
  /** Current rating, 0-`max`. Fractional for a display average (`4.8`). */
  value: number;
  max?: number;
  size?: IconSize;
  /** Interactive when set — renders `max` pressable stars and calls back with the tapped value. */
  onChange?: (value: number) => void;
  /** Read-only, non-interactive: show one star + the numeric average (`★ 4.8`) instead of a 5-star row. Ignored when `onChange` is set. */
  showValue?: boolean;
  accessibilityLabel?: string;
};

/**
 * A star rating — interactive picker or read-only display.
 *
 * Replaces nine places that rendered a literal `★` character: an interactive
 * 5-star `Pressable` row on the review screen, `'★'.repeat(n)` string
 * concatenation on the public profile, and `★ 4.8`-style strings inline in
 * trip, tracking, account and admin copy.
 */
export function Rating({ value, max = 5, size = 'md', onChange, showValue, accessibilityLabel }: RatingProps) {
  const stars = Array.from({ length: max }, (_, index) => index + 1);

  if (onChange) {
    return (
      <View style={styles.row} accessibilityLabel={accessibilityLabel}>
        {stars.map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            accessibilityRole="button"
            accessibilityLabel={`${n} étoile${n > 1 ? 's' : ''}`}
            accessibilityState={{ selected: n <= value }}
            hitSlop={sizes.hitSlop}
          >
            <Icon name={n <= value ? 'star' : 'star-outline'} size={size} color={n <= value ? 'brand' : 'tertiary'} />
          </Pressable>
        ))}
      </View>
    );
  }

  if (showValue ?? true) {
    return (
      <View style={styles.inline} accessibilityLabel={accessibilityLabel ?? `Note : ${value.toFixed(1)} sur ${max}`}>
        <Icon name="star" size={size} color="warning" />
        <AppText variant="bodySmall" color="secondary">
          {value.toFixed(1)}
        </AppText>
      </View>
    );
  }

  const filled = Math.round(value);
  return (
    <View style={styles.row} accessibilityLabel={accessibilityLabel ?? `${filled} sur ${max} étoiles`}>
      {stars.map((n) => (
        <Icon key={n} name={n <= filled ? 'star' : 'star-outline'} size={size} color={n <= filled ? 'warning' : 'tertiary'} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
});
