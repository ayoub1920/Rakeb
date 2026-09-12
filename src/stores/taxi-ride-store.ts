import { create } from 'zustand';

import type { Place } from '@/types/models';

/**
 * Pickup/destination the passenger is composing on `taxi/passenger/search.tsx`
 * before requesting a ride — client-only, outlives the screen the same way
 * `carpool-search-store` does. The ride itself, once created, is server data
 * owned by TanStack Query (`features/taxi`).
 */

export type TaxiRideDraftState = {
  pickup: Place | null;
  destination: Place | null;
};

export type TaxiRideDraftActions = {
  setPickup(place: Place | null): void;
  setDestination(place: Place | null): void;
  swap(): void;
  reset(): void;
};

const initialState: TaxiRideDraftState = {
  pickup: null,
  destination: null,
};

export const useTaxiRideStore = create<TaxiRideDraftState & TaxiRideDraftActions>((set) => ({
  ...initialState,

  setPickup: (pickup) => set({ pickup }),
  setDestination: (destination) => set({ destination }),

  swap: () => set((state) => ({ pickup: state.destination, destination: state.pickup })),

  reset: () => set(initialState),
}));

/** True once both points are set — enough to request a quote. */
export function useCanQuoteTaxiRide(): boolean {
  return useTaxiRideStore((state) => Boolean(state.pickup) && Boolean(state.destination));
}
