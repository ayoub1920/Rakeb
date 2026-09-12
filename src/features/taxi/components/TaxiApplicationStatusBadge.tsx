import { StatusPill, type StatusTone } from '@/components';

import type { TaxiApplicationStatus } from '../types';

/**
 * The single source of truth for how a taxi driver application status reads
 * in the UI. Lives here, not `@/components`, because it knows the taxi status
 * union; rendering itself is the shared `StatusPill`, same as carpool's
 * `TripStatusBadge`.
 */

type Tone = StatusTone;

const APPLICATION_META: Record<TaxiApplicationStatus, { label: string; tone: Tone }> = {
  pending: { label: 'En attente de validation', tone: 'warning' },
  approved: { label: 'Approuvée', tone: 'success' },
  rejected: { label: 'Refusée', tone: 'danger' },
};

export function TaxiApplicationStatusBadge({ status }: { status: TaxiApplicationStatus }) {
  const meta = APPLICATION_META[status] ?? { label: status, tone: 'neutral' as Tone };
  return <StatusPill label={meta.label} tone={meta.tone} />;
}

export function taxiApplicationStatusLabel(status: TaxiApplicationStatus): string {
  return (APPLICATION_META[status] ?? { label: status }).label;
}
