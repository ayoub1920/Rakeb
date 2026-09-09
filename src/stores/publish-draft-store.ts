import { create } from 'zustand';

import type { IsoDate, Millimes, Place } from '@/types/models';

/**
 * The driver's trip draft.
 *
 * `POST /trips` takes the whole trip in one payload, so the six wizard steps
 * edit this single object rather than six independent forms. The `review` step
 * submits it and calls `reset()` on success.
 *
 * Client-only state that outlives a screen — exactly what Zustand is for. The
 * published trip itself is server data owned by TanStack Query.
 */

export type PublishDraftState = {
  origin: Place | null;
  destination: Place | null;
  stops: Place[];
  /** `yyyy-MM-dd`. */
  departureDate: IsoDate | null;
  /** `HH:mm`, local time. */
  departureTime: string | null;
  vehicleId: string | null;
  seats: number;
  pricePerSeat: Millimes | null;
  instantBook: boolean;
  maxTwoInBack: boolean;
  notes: string;
  /** ISO weekday numbers (1 = Mon … 7 = Sun); empty = one-off trip. */
  recurrenceDays: number[];
  /** `yyyy-MM-dd` — last date children are generated for. */
  recurrenceUntil: IsoDate | null;
};

export type PublishDraftActions = {
  setOrigin(place: Place | null): void;
  setDestination(place: Place | null): void;
  addStop(place: Place): void;
  removeStop(index: number): void;
  setSchedule(date: IsoDate | null, time: string | null): void;
  setVehicle(vehicleId: string | null): void;
  setSeats(seats: number): void;
  setPrice(price: Millimes | null): void;
  setInstantBook(value: boolean): void;
  setMaxTwoInBack(value: boolean): void;
  setNotes(value: string): void;
  toggleRecurrenceDay(day: number): void;
  setRecurrenceUntil(date: IsoDate | null): void;
  reset(): void;
};

export const MIN_TRIP_SEATS = 1;
export const MAX_TRIP_SEATS = 4;

const initialState: PublishDraftState = {
  origin: null,
  destination: null,
  stops: [],
  departureDate: null,
  departureTime: null,
  vehicleId: null,
  seats: 2,
  pricePerSeat: null,
  instantBook: true,
  maxTwoInBack: false,
  notes: '',
  recurrenceDays: [],
  recurrenceUntil: null,
};

export const usePublishDraftStore = create<PublishDraftState & PublishDraftActions>((set) => ({
  ...initialState,

  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  addStop: (place) => set((state) => ({ stops: [...state.stops, place] })),
  removeStop: (index) => set((state) => ({ stops: state.stops.filter((_, i) => i !== index) })),
  setSchedule: (departureDate, departureTime) => set({ departureDate, departureTime }),
  setVehicle: (vehicleId) => set({ vehicleId }),
  setSeats: (seats) =>
    set({ seats: Math.min(MAX_TRIP_SEATS, Math.max(MIN_TRIP_SEATS, Math.trunc(seats))) }),
  setPrice: (pricePerSeat) => set({ pricePerSeat }),
  setInstantBook: (instantBook) => set({ instantBook }),
  setMaxTwoInBack: (maxTwoInBack) => set({ maxTwoInBack }),
  setNotes: (notes) => set({ notes }),
  toggleRecurrenceDay: (day) =>
    set((state) => ({
      recurrenceDays: state.recurrenceDays.includes(day)
        ? state.recurrenceDays.filter((d) => d !== day)
        : [...state.recurrenceDays, day].sort((a, b) => a - b),
    })),
  setRecurrenceUntil: (recurrenceUntil) => set({ recurrenceUntil }),
  reset: () => set(initialState),
}));

/** True once the draft holds everything `POST /trips` needs. */
export function useCanPublish(): boolean {
  return usePublishDraftStore(
    (s) =>
      s.origin !== null &&
      s.destination !== null &&
      s.departureDate !== null &&
      s.departureTime !== null &&
      s.vehicleId !== null &&
      s.pricePerSeat !== null &&
      s.pricePerSeat > 0 &&
      (s.recurrenceDays.length === 0 || s.recurrenceUntil !== null),
  );
}

/**
 * The wizard steps in order, each with the route it lives at and the predicate
 * the draft must satisfy to have legitimately reached it. Used by
 * `useRequirePublishStep` to bounce a step opened with an incomplete draft
 * (deep link, cold start) to the first step that still needs input.
 */
export const PUBLISH_STEPS = [
  { key: 'route', path: '/carpool/publish/route', reached: (_s: PublishDraftState) => true },
  {
    key: 'schedule',
    path: '/carpool/publish/schedule',
    reached: (s: PublishDraftState) => s.origin !== null && s.destination !== null,
  },
  {
    key: 'vehicle',
    path: '/carpool/publish/vehicle',
    reached: (s: PublishDraftState) =>
      s.origin !== null &&
      s.destination !== null &&
      s.departureDate !== null &&
      s.departureTime !== null,
  },
  {
    key: 'seats',
    path: '/carpool/publish/seats',
    reached: (s: PublishDraftState) =>
      s.origin !== null &&
      s.destination !== null &&
      s.departureDate !== null &&
      s.departureTime !== null &&
      s.vehicleId !== null,
  },
  {
    key: 'price',
    path: '/carpool/publish/price',
    reached: (s: PublishDraftState) =>
      s.origin !== null &&
      s.destination !== null &&
      s.departureDate !== null &&
      s.departureTime !== null &&
      s.vehicleId !== null,
  },
  {
    key: 'review',
    path: '/carpool/publish/review',
    reached: (s: PublishDraftState) =>
      s.origin !== null &&
      s.destination !== null &&
      s.departureDate !== null &&
      s.departureTime !== null &&
      s.vehicleId !== null &&
      s.pricePerSeat !== null &&
      s.pricePerSeat > 0,
  },
] as const;

export type PublishStepKey = (typeof PUBLISH_STEPS)[number]['key'];

/** 1-based index of `key` within the wizard. */
export function publishStepNumber(key: PublishStepKey): number {
  return PUBLISH_STEPS.findIndex((s) => s.key === key) + 1;
}

/** Path of the earliest step the current draft has *not* satisfied. */
export function firstIncompletePublishStep(state: PublishDraftState): string {
  const target = PUBLISH_STEPS.find((s) => !s.reached(state));
  return target?.path ?? PUBLISH_STEPS[PUBLISH_STEPS.length - 1].path;
}

/** True when the draft is still pristine (nothing entered yet). */
export function isPublishDraftEmpty(state: PublishDraftState): boolean {
  return (
    state.origin === null &&
    state.destination === null &&
    state.stops.length === 0 &&
    state.departureDate === null &&
    state.departureTime === null &&
    state.vehicleId === null &&
    state.pricePerSeat === null &&
    state.notes === '' &&
    state.recurrenceDays.length === 0
  );
}
