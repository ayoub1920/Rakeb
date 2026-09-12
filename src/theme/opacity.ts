/**
 * Opacity tokens.
 *
 * Pressed states drifted to three different values (0.7 / 0.85 / 0.9) across
 * `AppCard`, `AppButton` and one-off tiles before this existed — one value for
 * a full-surface press (a row, a card, a tile) and one for a small solid
 * control (a button, a pill) where a lighter touch reads better.
 */
export const opacity = {
  /** Full-surface pressables: cards, list rows, tiles. */
  pressed: 0.7,
  /** Small solid controls: buttons, filled pills, FABs. */
  pressedSubtle: 0.85,
  disabled: 0.5,
} as const;

export type OpacityToken = keyof typeof opacity;
