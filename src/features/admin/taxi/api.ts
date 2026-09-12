import { toCursorParams } from '@/api/pagination';
import { apiGet, apiPost } from '@/api/request';
import type { CursorPage, RequestOptions } from '@/types/api';

import type {
  AdminTaxiApplication,
  AdminTaxiRide,
  TaxiApplicationStatus,
  TaxiRideStatus,
} from '@/features/taxi/types';

/**
 * Admin review of taxi driver applications and ride oversight —
 * `rakeb-backend`'s `src/modules/admin/admin-taxi.controller.ts`.
 *
 * Deliberately self-contained (own HTTP calls), matching
 * `features/admin/licences/api.ts` — an admin feature never imports the
 * self-service feature's `api.ts`/`queries.ts`, only its response shape
 * (type-only import, erased at compile time, no runtime coupling).
 */

/** `GET /admin/taxi/applications?status=&cursor=&limit=` — `pending` by default. */
export function listAdminTaxiApplications(
  status: TaxiApplicationStatus | undefined,
  cursor: string | null,
  options?: RequestOptions,
): Promise<CursorPage<AdminTaxiApplication>> {
  return apiGet<CursorPage<AdminTaxiApplication>>(
    '/admin/taxi/applications',
    { status, ...toCursorParams(cursor) },
    options,
  );
}

/** `GET /admin/taxi/applications/{userId}`. */
export function getAdminTaxiApplication(
  userId: string,
  options?: RequestOptions,
): Promise<AdminTaxiApplication> {
  return apiGet<AdminTaxiApplication>(`/admin/taxi/applications/${userId}`, undefined, options);
}

function review(
  userId: string,
  status: 'approved' | 'rejected',
  reason?: string,
  options?: RequestOptions,
): Promise<void> {
  return apiPost<void>(`/admin/taxi/applications/${userId}/review`, { status, reason }, options);
}

export function approveTaxiApplication(userId: string, options?: RequestOptions): Promise<void> {
  return review(userId, 'approved', undefined, options);
}

/** A reason is required — the backend enforces it, the UI does too. */
export function rejectTaxiApplication(
  userId: string,
  reason: string,
  options?: RequestOptions,
): Promise<void> {
  return review(userId, 'rejected', reason, options);
}

/** `GET /admin/taxi/rides?status=&cursor=` — oversight list. */
export function listAdminTaxiRides(
  status: TaxiRideStatus | undefined,
  cursor: string | null,
  options?: RequestOptions,
): Promise<CursorPage<AdminTaxiRide>> {
  return apiGet<CursorPage<AdminTaxiRide>>(
    '/admin/taxi/rides',
    { status, ...toCursorParams(cursor) },
    options,
  );
}

/** `GET /admin/taxi/rides/{id}`. */
export function getAdminTaxiRide(rideId: string, options?: RequestOptions): Promise<AdminTaxiRide> {
  return apiGet<AdminTaxiRide>(`/admin/taxi/rides/${rideId}`, undefined, options);
}
