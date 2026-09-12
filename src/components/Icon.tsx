import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';

import { colors, sizes } from '@/theme';

export type IconName = keyof typeof Ionicons.glyphMap;
export type IconSize = keyof typeof sizes.icon;
export type IconColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'brand'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

/** Exported for components that render an icon outside `<Icon>` itself (e.g. `IconMedallion`, at a size the shared scale doesn't cover). */
export const ICON_COLOR_VALUES: Record<IconColor, string> = {
  primary: colors.text.primary,
  secondary: colors.text.secondary,
  tertiary: colors.text.tertiary,
  inverse: colors.text.inverse,
  brand: colors.brand.primary,
  accent: colors.brand.accent,
  success: colors.status.success,
  warning: colors.status.warning,
  error: colors.status.error,
  info: colors.status.info,
};

export type IconProps = {
  name: IconName;
  size?: IconSize;
  color?: IconColor;
  style?: StyleProp<TextStyle>;
};

/**
 * Every icon in the app.
 *
 * A thin wrapper over `Ionicons` bound to `sizes.icon` and the text/status
 * colour tokens, so call sites stop passing raw `size={22|28|40}` and hex-free
 * but still-literal colours. Before this existed, icon size and colour were
 * decided ad hoc per file — see the taxi feature, the only place icons existed
 * at all.
 */
export function Icon({ name, size = 'md', color = 'primary', style }: IconProps) {
  return <Ionicons name={name} size={sizes.icon[size]} color={ICON_COLOR_VALUES[color]} style={style} />;
}
