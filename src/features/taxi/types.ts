import type { Coordinates, Id, IsoDateTime, Millimes } from '@/types/models';

/**
 * Domain types for the on-demand taxi service, mirrored 1:1 from
 * `rakeb-backend`'s snake_case JSON — same convention `models.ts` uses
 * elsewhere in this codebase (no camelCase remapping layer).
 */

export type TaxiApplicationStatus = 'pending' | 'approved' | 'rejected';

export type TaxiDocumentSlotId =
  | 'licence_front'
  | 'licence_back'
  | 'cin_front'
  | 'cin_back'
  | 'driver_photo'
  | 'vehicle_photo';

export type TaxiDocumentSlot = {
  upload_id: Id | null;
  url: string | null;
};

export type TaxiApplicationDocuments = Record<TaxiDocumentSlotId, TaxiDocumentSlot>;

export type TaxiApplication = {
  id: Id;
  status: TaxiApplicationStatus;
  plate_number: string;
  rejection_reason: string | null;
  submitted_at: IsoDateTime;
  reviewed_at: IsoDateTime | null;
  documents: TaxiApplicationDocuments;
  is_online: boolean;
  is_available: boolean;
};

export type AdminTaxiApplication = TaxiApplication & {
  user_id: Id;
  display_name: string;
  phone: string;
  email: string | null;
  reviewed_by_user_id: Id | null;
};

export type TaxiRideStatus =
  | 'searching'
  | 'driver_assigned'
  | 'driver_arriving'
  | 'driver_arrived'
  | 'trip_started'
  | 'trip_completed'
  | 'cancelled'
  | 'expired';

export type NearbyTaxiDriver = {
  application_id: Id;
  driver_id: Id;
  display_name: string;
  photo_url: string | null;
  plate_number: string;
  location: Coordinates;
  distance_m: number;
};

export type TaxiRideQuote = {
  distance_m: number;
  duration_s: number;
  estimated_price: Millimes;
  currency: string;
  route: Coordinates[];
  nearby_drivers: NearbyTaxiDriver[];
};

export type TaxiRideDriverSummary = {
  id: Id;
  display_name: string;
  avatar_url: string | null;
  rating: number | null;
  plate_number: string;
  vehicle_photo_url: string | null;
};

export type TaxiRide = {
  id: Id;
  status: TaxiRideStatus;
  pickup_label: string;
  pickup: Coordinates;
  destination_label: string;
  destination: Coordinates;
  route: Coordinates[];
  distance_m: number | null;
  duration_s: number | null;
  estimated_price: Millimes | null;
  currency: string;
  driver: TaxiRideDriverSummary | null;
  requested_at: IsoDateTime;
  expires_at: IsoDateTime;
  assigned_at: IsoDateTime | null;
  arriving_at: IsoDateTime | null;
  arrived_at: IsoDateTime | null;
  started_at: IsoDateTime | null;
  completed_at: IsoDateTime | null;
  cancelled_at: IsoDateTime | null;
  cancelled_by_user_id: Id | null;
  cancellation_reason: string | null;
};

export type TaxiRideSummary = {
  id: Id;
  status: TaxiRideStatus;
  pickup_label: string;
  destination_label: string;
  estimated_price: Millimes | null;
  currency: string;
  requested_at: IsoDateTime;
  expires_at: IsoDateTime;
};

export type TaxiPosition = {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  recorded_at: IsoDateTime;
};

export type TaxiTracking = {
  ride_id: Id;
  status: TaxiRideStatus;
  position: TaxiPosition | null;
  eta_at: IsoDateTime | null;
  remaining_distance_m: number | null;
  traffic: 'normal' | 'slow' | 'unknown';
  live: boolean;
};

export type AdminTaxiRide = TaxiRide & {
  rider_id: Id;
  rider_display_name?: string;
};
