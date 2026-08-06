import { create } from 'zustand';

import type { IsoDate, Place } from '@/types/models';

/**
 * The carpool search criteria.
 *
 * This is client-only state that outlives a single screen: the user picks it on
 * the search screen, the results screen reads it, and the home screen reuses it
 * for "search again". That is exactly what Zustand is for here.
 *
 * The search *results* are not in this store — they are server data owned by
 * TanStack Query (`features/carpool/search`). Copying them here would give the
 * app two sources of truth for seat availability.
 */

export type CarpoolSearchState = {
  origin: Place | null;
  destination: Place | null;
  /** `yyyy-MM-dd`, matching `/trips/search?date=`. */
  date: IsoDate | null;
  seats: number;
};

export type CarpoolSearchActions = {
  setOrigin(place: Place | null): void;
  setDestination(place: Place | null): void;
  setDate(date: IsoDate | null): void;
  setSeats(seats: number): void;
  /** Swaps origin and destination — the single most used control on the form. */
  swapPlaces(): void;
  reset(): void;
};

export const MIN_SEATS = 1;
/** A car has four passenger seats at most; the API rejects more. */
export const MAX_SEATS = 4;

const initialState: CarpoolSearchState = {
  origin: null,
  destination: null,
  date: null,
  seats: 1,
};

export const useCarpoolSearchStore = create<CarpoolSearchState & CarpoolSearchActions>((set) => ({
  ...initialState,

  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setDate: (date) => set({ date }),
  setSeats: (seats) => set({ seats: Math.min(MAX_SEATS, Math.max(MIN_SEATS, Math.trunc(seats))) }),

  swapPlaces: () => set((state) => ({ origin: state.destination, destination: state.origin })),

  reset: () => set(initialState),
}));

/** True once the store holds enough to call `/trips/search`. */
export function useCanSearch(): boolean {
  return useCarpoolSearchStore((state) => state.origin !== null && state.destination !== null);
}
