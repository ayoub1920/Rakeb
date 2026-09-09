import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components';
import { colors, radius, spacing } from '@/theme';
import type { BookingStatus, TripStatus } from '@/types/models';

/**
 * The single source of truth for how a trip / booking status reads in the UI.
 *
 * Driver and passenger screens both render these so the two sides always use
 * the same French vocabulary ("Covoiturage démarré", "Terminé", …). Lives in
 * the trips feature, not `@/components`, because it knows the status unions.
 */

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const TONE_SURFACE: Record<Tone, string> = {
  neutral: colors.background.surface,
  info: colors.status.infoSurface,
  success: colors.status.successSurface,
  warning: colors.status.warningSurface,
  danger: colors.status.errorSurface,
};

const TONE_TEXT: Record<Tone, string> = {
  neutral: colors.text.secondary,
  info: colors.status.info,
  success: colors.status.success,
  warning: colors.status.warning,
  danger: colors.status.error,
};

const TRIP_META: Record<TripStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Brouillon', tone: 'neutral' },
  published: { label: 'Publié', tone: 'info' },
  full: { label: 'Complet', tone: 'warning' },
  in_progress: { label: 'Covoiturage démarré', tone: 'success' },
  completed: { label: 'Terminé', tone: 'neutral' },
  cancelled: { label: 'Annulé', tone: 'danger' },
};

const BOOKING_META: Record<BookingStatus, { label: string; tone: Tone }> = {
  pending: { label: 'En attente d’acceptation', tone: 'warning' },
  confirmed: { label: 'Confirmé', tone: 'info' },
  in_progress: { label: 'Covoiturage en cours', tone: 'success' },
  completed: { label: 'Terminé', tone: 'neutral' },
  declined: { label: 'Refusé', tone: 'danger' },
  cancelled_by_rider: { label: 'Annulé', tone: 'danger' },
  cancelled_by_driver: { label: 'Annulé par le conducteur', tone: 'danger' },
  expired: { label: 'Expiré', tone: 'neutral' },
  no_show: { label: 'Absent au départ', tone: 'danger' },
};

function Pill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <View style={[styles.pill, { backgroundColor: TONE_SURFACE[tone] }]}>
      <AppText variant="caption" style={{ color: TONE_TEXT[tone] }}>
        {label}
      </AppText>
    </View>
  );
}

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const meta = TRIP_META[status] ?? { label: status, tone: 'neutral' as Tone };
  return <Pill label={meta.label} tone={meta.tone} />;
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const meta = BOOKING_META[status] ?? { label: status, tone: 'neutral' as Tone };
  return <Pill label={meta.label} tone={meta.tone} />;
}

/** The label alone, for places that render their own container. */
export function tripStatusLabel(status: TripStatus): string {
  return (TRIP_META[status] ?? { label: status }).label;
}

export function bookingStatusLabel(status: BookingStatus): string {
  return (BOOKING_META[status] ?? { label: status }).label;
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
});
