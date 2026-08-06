import { colors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { sizes } from './sizes';
import { screenPadding, spacing } from './spacing';
import { typography } from './typography';

/**
 * The design tokens, in one object.
 *
 * There is intentionally no theme *context* and no dark mode yet: a single
 * frozen object keeps `StyleSheet.create` at module scope, which is what makes
 * styles cheap. If dark mode is added, the tokens become two objects selected
 * by a provider, and only `theme` consumers change.
 */
export const theme = {
  colors,
  spacing,
  screenPadding,
  typography,
  radius,
  shadows,
  sizes,
} as const;

export type Theme = typeof theme;

export { colors, spacing, screenPadding, typography, radius, shadows, sizes };
export { fontSize, fontWeight, textVariants } from './typography';
export type { TextVariant } from './typography';
export type { SpacingToken } from './spacing';
export type { RadiusToken } from './radius';
export type { ShadowToken } from './shadows';
