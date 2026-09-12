import type { TaxiRideStatus } from './types';

/** The single-button "advance" sequence a driver walks through. Mirrors the backend state machine. */
export const RIDE_PROGRESS_ORDER = [
  'driver_assigned',
  'driver_arriving',
  'driver_arrived',
  'trip_started',
  'trip_completed',
] as const satisfies readonly TaxiRideStatus[];

const NEXT_STATUS: Partial<Record<TaxiRideStatus, TaxiRideStatus>> = {
  driver_assigned: 'driver_arriving',
  driver_arriving: 'driver_arrived',
  driver_arrived: 'trip_started',
  trip_started: 'trip_completed',
};

const NEXT_ACTION_LABEL: Partial<Record<TaxiRideStatus, string>> = {
  driver_assigned: 'Je suis en route',
  driver_arriving: 'Je suis arrivé',
  driver_arrived: 'Démarrer la course',
  trip_started: 'Terminer la course',
};

/** The status a driver's "advance" tap moves the ride to, or `null` once terminal. */
export function nextDriverStatus(current: TaxiRideStatus): TaxiRideStatus | null {
  return NEXT_STATUS[current] ?? null;
}

/** Label for the single primary button on the driver's active-ride screen. */
export function nextDriverActionLabel(current: TaxiRideStatus): string | null {
  return NEXT_ACTION_LABEL[current] ?? null;
}

export const ACTIVE_TAXI_RIDE_STATUSES: TaxiRideStatus[] = [
  'searching',
  'driver_assigned',
  'driver_arriving',
  'driver_arrived',
  'trip_started',
];

export function isActiveRideStatus(status: TaxiRideStatus): boolean {
  return ACTIVE_TAXI_RIDE_STATUSES.includes(status);
}
