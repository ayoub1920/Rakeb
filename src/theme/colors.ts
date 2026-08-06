/**
 * Colour tokens.
 *
 * Components must reference tokens, never literals. When the brand palette is
 * finalized this file changes and nothing else does.
 */
export const colors = {
  brand: {
    primary: '#0E7C66',
    primaryDark: '#0A5C4C',
    primaryLight: '#3FA48E',
    /** Tinted background for primary-coloured surfaces (badges, banners). */
    primarySurface: '#E6F4F0',
    accent: '#F2A413',
    accentSurface: '#FDF3E0',
  },
  text: {
    primary: '#101828',
    secondary: '#475467',
    tertiary: '#98A2B3',
    inverse: '#FFFFFF',
    /** Text on a disabled control. Meets 4.5:1 on `background.disabled`. */
    disabled: '#98A2B3',
  },
  background: {
    default: '#FFFFFF',
    surface: '#F7F8FA',
    surfaceRaised: '#FFFFFF',
    disabled: '#EAECF0',
    overlay: 'rgba(16, 24, 40, 0.45)',
  },
  border: {
    default: '#E4E7EC',
    strong: '#D0D5DD',
    focus: '#0E7C66',
    error: '#D92D20',
  },
  status: {
    success: '#067647',
    successSurface: '#ECFDF3',
    warning: '#B54708',
    warningSurface: '#FFFAEB',
    error: '#D92D20',
    errorSurface: '#FEF3F2',
    info: '#175CD3',
    infoSurface: '#EFF8FF',
  },
  /** Reserved for development-only affordances so they are visibly temporary. */
  development: {
    border: '#B692F6',
    surface: '#F4F3FF',
    text: '#5925DC',
  },
} as const;

export type Colors = typeof colors;
