export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  /** Fully rounded — pills, avatars, floating buttons. */
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radius;
