import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const TONE_SURFACE: Record<StatusTone, string> = {
  neutral: colors.background.surface,
  info: colors.status.infoSurface,
  success: colors.status.successSurface,
  warning: colors.status.warningSurface,
  danger: colors.status.errorSurface,
};

const TONE_TEXT: Record<StatusTone, string> = {
  neutral: colors.text.secondary,
  info: colors.status.info,
  success: colors.status.success,
  warning: colors.status.warning,
  danger: colors.status.error,
};

export type StatusPillProps = {
  label: string;
  tone?: StatusTone;
};

/**
 * A tinted pill for a status label.
 *
 * The single primitive behind every status badge in the app — a trip's,
 * booking's, taxi ride's or taxi application's status. Each feature keeps its
 * own status → `{ label, tone }` lookup (e.g. `carpool/trips/components/
 * TripStatusBadge.tsx`) and renders it through this; before this existed, that
 * lookup-plus-pill pair was copied verbatim into three files, and five more
 * places (mostly admin) built their own incompatible pill instead — a
 * `${colour}1A` hex-alpha hack, a bordered variant, or a plain brand-tinted tag.
 */
export function StatusPill({ label, tone = 'neutral' }: StatusPillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: TONE_SURFACE[tone] }]}>
      <AppText variant="caption" style={{ color: TONE_TEXT[tone] }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
});
