import { apiGet, apiPatch, apiPost } from '@/api/request';
import { createRequestId } from '@/api/request-id';
import { toCursorParams } from '@/api/pagination';
import type { CursorPage, RequestOptions } from '@/types/api';
import type { Coordinates } from '@/types/models';

import type {
  TaxiApplication,
  TaxiRide,
  TaxiRideQuote,
  TaxiRideSummary,
  TaxiRideStatus,
  TaxiTracking,
} from './types';

/**
 * On-demand taxi — `rakeb-backend`'s `modules/taxi`. A sibling of
 * `features/carpool`, not an extension of it: nothing here is imported by
 * carpool code, and this imports nothing from carpool.
 */

// --- driver application -----------------------------------------------

export type SubmitTaxiApplicationInput = {
  plate_number: string;
  licence_front_upload_id: string;
  licence_back_upload_id?: string;
  cin_front_upload_id: string;
  cin_back_upload_id?: string;
  driver_photo_upload_id: string;
  vehicle_photo_upload_id: string;
};

/** `GET /me/taxi/application`. 404 (thrown as `ApiError`) means no application yet. */
export function getMyTaxiApplication(options?: RequestOptions): Promise<TaxiApplication> {
  return apiGet<TaxiApplication>('/me/taxi/application', undefined, options);
}

/** `POST /me/taxi/application` — submit, or resubmit after a rejection. */
export function submitTaxiApplication(
  input: SubmitTaxiApplicationInput,
  options?: RequestOptions,
): Promise<TaxiApplication> {
  return apiPost<TaxiApplication>('/me/taxi/application', input, options);
}

/** `PATCH /me/taxi/availability` — go online / offline as a taxi driver. */
export function setTaxiAvailability(
  isOnline: boolean,
  options?: RequestOptions,
): Promise<TaxiApplication> {
  return apiPatch<TaxiApplication>('/me/taxi/availability', { is_online: isOnline }, options);
}

export type TaxiDriverLocation = Coordinates & {
  heading?: number;
  speed?: number;
  accuracy?: number;
};

/** `POST /me/taxi/location` — always updates dispatch position; live-tracks an engaged ride too. */
export function pushTaxiDriverLocation(
  position: TaxiDriverLocation,
  options?: RequestOptions,
): Promise<{ accepted: true }> {
  return apiPost<{ accepted: true }>('/me/taxi/location', position, options);
}

// --- rides --------------------------------------------------------------

export type TaxiRideRequestInput = {
  pickup_label: string;
  pickup: Coordinates;
  destination_label: string;
  destination: Coordinates;
};

/** `POST /taxi/rides/quote` — no side effects: route, price, nearby drivers. */
export function quoteTaxiRide(
  input: TaxiRideRequestInput,
  options?: RequestOptions,
): Promise<TaxiRideQuote> {
  return apiPost<TaxiRideQuote>('/taxi/rides/quote', input, options);
}

/**
 * `POST /taxi/rides` — commits the request. A fresh `Idempotency-Key` per
 * attempt, same reasoning as `createBooking`: a retry of the same tap must
 * not create a second ride, but a deliberate new request must.
 */
export function createTaxiRide(
  input: TaxiRideRequestInput,
  options?: RequestOptions,
): Promise<TaxiRide> {
  return apiPost<TaxiRide>('/taxi/rides', input, {
    ...options,
    headers: { 'Idempotency-Key': createRequestId() },
  });
}

/** `GET /taxi/rides?role=&status=&cursor=` — the rider's or driver's own rides. */
export function listMyTaxiRides(
  role: 'rider' | 'driver',
  status: TaxiRideStatus | undefined,
  cursor: string | null,
  options?: RequestOptions,
): Promise<CursorPage<TaxiRideSummary>> {
  return apiGet<CursorPage<TaxiRideSummary>>(
    '/taxi/rides',
    { role, status, ...toCursorParams(cursor) },
    options,
  );
}

/** `GET /taxi/rides/{id}`. */
export function getTaxiRide(rideId: string, options?: RequestOptions): Promise<TaxiRide> {
  return apiGet<TaxiRide>(`/taxi/rides/${rideId}`, undefined, options);
}

/** `GET /taxi/rides/{id}/tracking` — polling fallback for `/ws/taxi`. */
export function getTaxiRideTracking(
  rideId: string,
  options?: RequestOptions,
): Promise<TaxiTracking> {
  return apiGet<TaxiTracking>(`/taxi/rides/${rideId}/tracking`, undefined, options);
}

/** `GET /taxi/rides/available` — driver-side poll fallback for the push notification. */
export function listAvailableTaxiRides(
  limit: number | undefined,
  options?: RequestOptions,
): Promise<TaxiRideSummary[]> {
  return apiGet<TaxiRideSummary[]>('/taxi/rides/available', { limit }, options);
}

/** `POST /taxi/rides/{id}/accept` — driver accepts a searching ride. */
export function acceptTaxiRide(rideId: string, options?: RequestOptions): Promise<TaxiRide> {
  return apiPost<TaxiRide>(`/taxi/rides/${rideId}/accept`, undefined, {
    ...options,
    headers: { 'Idempotency-Key': createRequestId() },
  });
}

/** `POST /taxi/rides/{id}/status` — driver advances to the next lifecycle step. */
export function updateTaxiRideStatus(
  rideId: string,
  status: Exclude<TaxiRideStatus, 'searching' | 'driver_assigned' | 'cancelled' | 'expired'>,
  options?: RequestOptions,
): Promise<TaxiRide> {
  return apiPost<TaxiRide>(
    `/taxi/rides/${rideId}/status`,
    { status },
    { ...options, headers: { 'Idempotency-Key': createRequestId() } },
  );
}

/** `POST /taxi/rides/{id}/cancel` — rider or assigned driver. */
export function cancelTaxiRide(
  rideId: string,
  reason: string | undefined,
  options?: RequestOptions,
): Promise<TaxiRide> {
  return apiPost<TaxiRide>(
    `/taxi/rides/${rideId}/cancel`,
    { reason },
    { ...options, headers: { 'Idempotency-Key': createRequestId() } },
  );
}

// Admin review lives in `features/admin/taxi/api.ts` — a separate,
// self-contained feature, matching `features/admin/licences` (never imports
// the self-service feature's `api.ts`, only shares the response shape via a
// type-only import).
