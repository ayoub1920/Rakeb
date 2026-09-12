import { Platform, type ViewStyle } from 'react-native';

/**
 * Elevation presets.
 *
 * iOS uses `shadow*`, Android uses `elevation`. Both are set so a card looks
 * the same on either platform without a per-component `Platform.select`.
 */

function shadow(
  elevation: number,
  opacity: number,
  radiusValue: number,
  offsetY: number,
): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#101828',
      shadowOpacity: opacity,
      shadowRadius: radiusValue,
      shadowOffset: { width: 0, height: offsetY },
    },
    android: { elevation },
    default: {
      shadowColor: '#101828',
      shadowOpacity: opacity,
      shadowRadius: radiusValue,
      shadowOffset: { width: 0, height: offsetY },
    },
  }) as ViewStyle;
}

export const shadows = {
  none: {} as ViewStyle,
  /** Cards resting on the surface. */
  sm: shadow(1, 0.06, 4, 1),
  /** Raised cards, bottom sheets. */
  md: shadow(3, 0.1, 10, 4),
  /** Floating action buttons, popovers. */
  lg: shadow(6, 0.14, 20, 8),
  /** Anchored bottom panels/sheets — casts upward, toward the content above. */
  panelTop: shadow(8, 0.1, 12, -4),
} as const;

export type ShadowToken = keyof typeof shadows;
