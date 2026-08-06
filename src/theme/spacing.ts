/** 4pt spacing scale. Use these instead of raw numbers in `StyleSheet.create`. */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export type SpacingToken = keyof typeof spacing;

/** Standard horizontal padding for screen content. */
export const screenPadding = spacing.lg;
