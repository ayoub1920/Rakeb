import type { Id, IsoDate, TripSortOption } from '@/types/models';

/** Query parameters for `GET /trips/search`. */
export type TripSearchParams = {
  from_place_id: Id;
  to_place_id: Id;
  date?: IsoDate;
  seats?: number;
  radius_km?: number;
  sort?: TripSortOption;
  /** Sent comma-joined: `filters=direct,instant_book,verified`. */
  filters?: TripSearchFilter[];
};

export type TripSearchFilter = 'direct' | 'instant_book' | 'verified';
