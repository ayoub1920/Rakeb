/** Component sizing tokens. */
export const sizes = {
  /** iOS HIG / Material minimum tap target. Every pressable must reach it. */
  minTouchTarget: 44,
  button: {
    sm: 36,
    md: 48,
    lg: 56,
  },
  input: {
    height: 48,
    /** Multiline inputs (messages, report details). */
    minHeightMultiline: 96,
  },
  avatar: {
    sm: 32,
    md: 44,
    lg: 72,
  },
  icon: {
    sm: 16,
    md: 20,
    lg: 24,
  },
  /** Extra tap area added around small controls. */
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
} as const;

export type Sizes = typeof sizes;
