import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, opacity, radius, shadows, sizes } from '@/theme';

import { Icon, type IconColor, type IconName } from './Icon';

export type IconButtonVariant = 'plain' | 'surface' | 'outlined' | 'solid' | 'floating';
export type IconButtonSize = 'sm' | 'md' | 'lg';

const DIMENSION: Record<IconButtonSize, number> = {
  sm: 36,
  md: 44,
  lg: 52,
};

const ICON_SIZE: Record<IconButtonSize, 'sm' | 'md' | 'lg' | 'xl'> = {
  sm: 'md',
  md: 'md',
  lg: 'lg',
};

const ICON_COLOR: Record<IconButtonVariant, IconColor> = {
  plain: 'secondary',
  surface: 'secondary',
  outlined: 'brand',
  solid: 'inverse',
  floating: 'inverse',
};

export type IconButtonProps = {
  name: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A circular, icon-only control.
 *
 * Replaces the swap button in the taxi ride-request sheet, the `←` glyph back
 * button in `ScreenHeader`, the `−`/`+` glyph steppers duplicated across
 * carpool's search and publish screens, and the floating support button —
 * each of which hand-rolled its own circle, hit target and (for `floating`) a
 * `Platform.select` shadow.
 */
export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  variant = 'surface',
  size = 'md',
  disabled = false,
  style,
  testID,
}: IconButtonProps) {
  const dimension = DIMENSION[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={sizes.hitSlop}
      style={({ pressed }) => [
        styles.base,
        { width: dimension, height: dimension },
        variantStyles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Icon name={name} size={ICON_SIZE[size]} color={disabled ? 'tertiary' : ICON_COLOR[variant]} />
    </Pressable>
  );
}

const variantStyles = StyleSheet.create({
  plain: {
    backgroundColor: 'transparent',
  },
  surface: {
    backgroundColor: colors.background.surface,
    borderRadius: radius.pill,
  },
  outlined: {
    backgroundColor: colors.background.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radius.pill,
  },
  solid: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.pill,
  },
  floating: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.pill,
    ...shadows.lg,
  },
});

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: opacity.pressedSubtle,
  },
  disabled: {
    opacity: opacity.disabled,
  },
});
