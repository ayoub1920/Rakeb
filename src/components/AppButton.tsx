import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, opacity, radius, sizes, spacing } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type AppButtonSize = 'sm' | 'md' | 'lg';

export type AppButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  loading?: boolean;
  disabled?: boolean;
  /** Stretches to the container width. Default `true` — most buttons are full width. */
  fullWidth?: boolean;
  /** Rendered before/after the label. Hidden while `loading`. */
  iconLeft?: IconName;
  iconRight?: IconName;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Defaults to `label`; override when the label alone is not descriptive. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  iconLeft,
  iconRight,
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
}: AppButtonProps) {
  const isInactive = disabled || loading;
  const iconColor = isInactive ? 'tertiary' : labelColor[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      // `busy` is what a screen reader announces while a mutation is running.
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { height: sizes.button[size] },
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        pressed && !isInactive && styles.pressed,
        isInactive && styles.inactive,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={labelColor[variant] === 'inverse' ? colors.text.inverse : colors.brand.primary}
          />
        ) : (
          <>
            {iconLeft ? <Icon name={iconLeft} size="md" color={iconColor} /> : null}
            <AppText variant="button" color={iconColor}>
              {label}
            </AppText>
            {iconRight ? <Icon name={iconRight} size="md" color={iconColor} /> : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

const labelColor: Record<AppButtonVariant, 'inverse' | 'brand' | 'error'> = {
  primary: 'inverse',
  secondary: 'brand',
  ghost: 'brand',
  danger: 'inverse',
};

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.brand.primary,
  },
  secondary: {
    backgroundColor: colors.brand.primarySurface,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.status.error,
  },
});

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: {
    opacity: opacity.pressedSubtle,
  },
  inactive: {
    backgroundColor: colors.background.disabled,
    borderColor: colors.border.default,
  },
});
