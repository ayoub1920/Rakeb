import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { colors, opacity, radius, shadows, spacing } from '@/theme';

import { Icon } from './Icon';

export type AppCardProps = {
  children: ReactNode;
  /** Makes the whole card a button. Requires `accessibilityLabel`. */
  onPress?: () => void;
  accessibilityLabel?: string;
  padded?: boolean;
  /** Rendered before `children` — an `Avatar`, an `IconMedallion`. */
  leading?: ReactNode;
  /** Rendered after `children`. Overrides `chevron`. */
  trailing?: ReactNode;
  /** Auto-renders a trailing chevron when the card is pressable. Ignored if `trailing` is set. */
  chevron?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Surface for grouped content — a trip in a result list, a booking summary.
 *
 * `leading` / `trailing` exist so a menu row, a conversation preview or a
 * booking card can add an icon/avatar and a chevron without hand-rolling the
 * row layout each time — before these slots existed, that row was declared
 * inline in over twenty route files.
 */
export function AppCard({
  children,
  onPress,
  accessibilityLabel,
  padded = true,
  leading,
  trailing,
  chevron = false,
  style,
  testID,
}: AppCardProps) {
  const trailingNode =
    trailing ?? (chevron && onPress ? <Icon name="chevron-forward" size="lg" color="tertiary" /> : null);
  const content =
    leading || trailingNode ? (
      <View style={styles.row}>
        {leading}
        <View style={styles.rowContent}>{children}</View>
        {trailingNode}
      </View>
    ) : (
      children
    );

  if (!onPress) {
    return (
      <View style={[styles.card, padded && styles.padded, style]} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.card,
        padded && styles.padded,
        pressed && styles.pressed,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  padded: {
    padding: spacing.lg,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowContent: {
    flex: 1,
    gap: spacing.xxs,
  },
});
