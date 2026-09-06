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
