import type { TextStyle } from 'react-native';

/**
 * Type scale.
 *
 * The app uses the platform system font. If a brand font is added later, it is
 * loaded once in the root layout and referenced here via `fontFamily` — no
 * component should ever set a font directly.
 */

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

/** Named text styles consumed by `AppText` via its `variant` prop. */
export const textVariants = {
  title: {
    fontSize: fontSize.xxl,
    lineHeight: 34,
    fontWeight: fontWeight.bold,
  },
  heading: {
    fontSize: fontSize.xl,
    lineHeight: 28,
    fontWeight: fontWeight.semibold,
  },
  subheading: {
    fontSize: fontSize.lg,
    lineHeight: 24,
    fontWeight: fontWeight.semibold,
  },
  body: {
    fontSize: fontSize.md,
    lineHeight: 24,
    fontWeight: fontWeight.regular,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    fontWeight: fontWeight.regular,
  },
  label: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    fontWeight: fontWeight.medium,
  },
  caption: {
    fontSize: fontSize.xs,
    lineHeight: 16,
    fontWeight: fontWeight.regular,
  },
  button: {
    fontSize: fontSize.md,
    lineHeight: 20,
    fontWeight: fontWeight.semibold,
  },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof textVariants;

export const typography = { fontSize, fontWeight, textVariants } as const;
