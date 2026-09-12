import { StatusPill, type StatusTone } from '@/components';
import type { BookingStatus, TripStatus } from '@/types/models';

/**
 * The single source of truth for how a trip / booking status reads in the UI.
 *
 * Driver and passenger screens both render these so the two sides always use
 * the same French vocabulary ("Covoiturage démarré", "Terminé", …). Lives in
 * the trips feature, not `@/components`, because it knows the status unions;
 * rendering itself is the shared `StatusPill`.
 */

type Tone = StatusTone;

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

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const meta = TRIP_META[status] ?? { label: status, tone: 'neutral' as Tone };
  return <StatusPill label={meta.label} tone={meta.tone} />;
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const meta = BOOKING_META[status] ?? { label: status, tone: 'neutral' as Tone };
  return <StatusPill label={meta.label} tone={meta.tone} />;
}

/** The label alone, for places that render their own container. */
export function tripStatusLabel(status: TripStatus): string {
  return (TRIP_META[status] ?? { label: status }).label;
}

export function bookingStatusLabel(status: BookingStatus): string {
  return (BOOKING_META[status] ?? { label: status }).label;
}
