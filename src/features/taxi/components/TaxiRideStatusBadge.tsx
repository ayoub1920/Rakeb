import { StatusPill, type StatusTone } from '@/components';

import type { TaxiRideStatus } from '../types';

type Tone = StatusTone;

const RIDE_META: Record<TaxiRideStatus, { label: string; tone: Tone }> = {
  searching: { label: 'Recherche d’un chauffeur…', tone: 'warning' },
  driver_assigned: { label: 'Chauffeur trouvé', tone: 'info' },
  driver_arriving: { label: 'Le chauffeur arrive', tone: 'info' },
  driver_arrived: { label: 'Le chauffeur est arrivé', tone: 'info' },
  trip_started: { label: 'Course en cours', tone: 'success' },
  trip_completed: { label: 'Course terminée', tone: 'neutral' },
  cancelled: { label: 'Annulée', tone: 'danger' },
  expired: { label: 'Expirée', tone: 'danger' },
};

export function TaxiRideStatusBadge({ status }: { status: TaxiRideStatus }) {
  const meta = RIDE_META[status] ?? { label: status, tone: 'neutral' as Tone };
  return <StatusPill label={meta.label} tone={meta.tone} />;
}

export function taxiRideStatusLabel(status: TaxiRideStatus): string {
  return (RIDE_META[status] ?? { label: status }).label;
}
