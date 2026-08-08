/**
 * Colour tokens.
 *
 * Components must reference tokens, never literals. When the brand palette is
 * finalized this file changes and nothing else does.
 */
export const colors = {
  brand: {
    primary: '#0F5C66',
    primaryDark: '#0B4650',
    primaryLight: '#3F8A91',
    /** Tinted background for primary-coloured surfaces (badges, banners). */
    primarySurface: '#F4F9F9',
    accent: '#C25E32',
    accentSurface: '#FBEDE6',
  },
  text: {
    primary: '#23201C',
    secondary: '#5C564E',
    tertiary: '#8A8378',
    inverse: '#FFFFFF',
    /** Text on a disabled control. Meets 4.5:1 on `background.disabled`. */
    disabled: '#A29A8E',
  },
  background: {
    default: '#FFFFFF',
    surface: '#F6F3ED',
    surfaceRaised: '#FFFFFF',
    disabled: '#EDE8DF',
    overlay: 'rgba(35, 32, 28, 0.45)',
  },
  border: {
    default: '#E4DED4',
    strong: '#DCD5C9',
    focus: '#0F5C66',
    error: '#D92D20',
  },
  status: {
    success: '#1F7A4D',
    successSurface: '#E9F5EE',
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
