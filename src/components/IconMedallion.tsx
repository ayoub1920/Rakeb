import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, sizes } from '@/theme';

import { ICON_COLOR_VALUES, type IconColor, type IconName } from './Icon';

export type MedallionSize = keyof typeof sizes.medallion;
export type MedallionShape = 'circle' | 'square';
export type MedallionTone = 'brand' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';

const TONE_SURFACE: Record<MedallionTone, string> = {
  brand: colors.brand.primarySurface,
  accent: colors.brand.accentSurface,
  success: colors.status.successSurface,
  warning: colors.status.warningSurface,
  error: colors.status.errorSurface,
  neutral: colors.background.surface,
};

const TONE_ICON_COLOR: Record<MedallionTone, IconColor> = {
  brand: 'brand',
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  error: 'error',
  neutral: 'secondary',
};

/** Icon size scales with the medallion, not with the general icon scale. */
const ICON_SIZE_PX: Record<MedallionSize, number> = {
  sm: 28,
  md: 32,
  lg: 40,
};

export type IconMedallionProps = {
  icon: IconName;
  size?: MedallionSize;
  /** `circle` for a hero moment (taxi's landing screen); `square` for a
   * leading icon tile in a row (taxi's `ChoiceCard`). */
  shape?: MedallionShape;
  tone?: MedallionTone;
  style?: StyleProp<ViewStyle>;
};

/**
 * A tinted, icon-holding circle or rounded square.
 *
 * Extracted from three copies that each picked their own size and shape by
 * hand: the 88pt hero circle on the taxi landing screen, the 56pt icon tile in
 * its choice cards, and the 64pt confirmation icon on the forgot-password
 * screen.
 */
export function IconMedallion({
  icon,
  size = 'md',
  shape = 'circle',
  tone = 'brand',
  style,
}: IconMedallionProps) {
  const dimension = sizes.medallion[size];

  return (
    <View
      style={[
        styles.base,
        {
          width: dimension,
          height: dimension,
          borderRadius: shape === 'circle' ? radius.pill : radius.lg,
          backgroundColor: TONE_SURFACE[tone],
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={ICON_SIZE_PX[size]} color={ICON_COLOR_VALUES[TONE_ICON_COLOR[tone]]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
