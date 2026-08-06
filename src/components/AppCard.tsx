import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { colors, radius, shadows, spacing } from '@/theme';

export type AppCardProps = {
  children: ReactNode;
  /** Makes the whole card a button. Requires `accessibilityLabel`. */
  onPress?: () => void;
  accessibilityLabel?: string;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Surface for grouped content — a trip in a result list, a booking summary. */
export function AppCard({
  children,
  onPress,
  accessibilityLabel,
  padded = true,
  style,
  testID,
}: AppCardProps) {
  if (!onPress) {
    return (
      <View style={[styles.card, padded && styles.padded, style]} testID={testID}>
        {children}
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
      {children}
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
    opacity: 0.9,
  },
});
