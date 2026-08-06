import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { colors, textVariants, type TextVariant } from '@/theme';

export type AppTextColor =
  'primary' | 'secondary' | 'tertiary' | 'inverse' | 'brand' | 'error' | 'success' | 'development';

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: AppTextColor;
  align?: TextStyle['textAlign'];
};

const COLOR_VALUES: Record<AppTextColor, string> = {
  primary: colors.text.primary,
  secondary: colors.text.secondary,
  tertiary: colors.text.tertiary,
  inverse: colors.text.inverse,
  brand: colors.brand.primary,
  error: colors.status.error,
  success: colors.status.success,
  development: colors.development.text,
};

/**
 * Every piece of text in the app.
 *
 * Using it rather than `Text` directly is what keeps the type scale in one
 * place and guarantees `allowFontScaling` stays on — RN's default is easy to
 * disable accidentally, and it is the main accessibility lever users have.
 */
export function AppText({
  variant = 'body',
  color = 'primary',
  align,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        styles[variant],
        { color: COLOR_VALUES[color] },
        align ? { textAlign: align } : null,
        style,
      ]}
      allowFontScaling
      {...rest}
    />
  );
}

const styles = StyleSheet.create(textVariants);
