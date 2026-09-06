import { toCursorParams } from '@/api/pagination';
import { apiGet, apiPatch } from '@/api/request';
import type { CursorPage, RequestOptions } from '@/types/api';
import type {
  AdminUserDetailResponse,
  AdminUserSummaryResponse,
  PaginatedResponse,
} from '@/types/api-responses';
import type { AdminUserDetail, AdminUserSummary, UserRole, UserStatus } from '@/types/models';

/**
 * Admin user directory — `rakeb-backend`'s
 * `src/modules/admin/admin-users.controller.ts`. Not in `API Rakeb.md`.
 *
 * `search`/`getDetail` accept `admin` or `support`; `setStatus`/`setRole`
 * require `admin` — the backend enforces both, never this client. The
 * backend also refuses to let an admin change their own status or role
 * (`BAD_REQUEST`); the detail screen hides those actions for that case
 * rather than relying on the error message.
 */

function toSummary(dto: AdminUserSummaryResponse): AdminUserSummary {
  return {
    id: dto.id,
    phone: dto.phone,
    email: dto.email,
    display_name: dto.display_name,
    role: dto.role as UserRole,
    status: dto.status as UserStatus,
    rating: dto.rating,
    created_at: dto.created_at,
  };
}

function toDetail(dto: AdminUserDetailResponse): AdminUserDetail {
  return {
    ...toSummary(dto),
    first_name: dto.first_name,
    last_name: dto.last_name,
    phone_verified: dto.phone_verified,
    email_verified: dto.email_verified,
    reviews_count: dto.reviews_count,
    trips_as_driver: dto.trips_as_driver,
    trips_as_rider: dto.trips_as_rider,
    referral_code: dto.referral_code,
    verifications: {
      cin: dto.verifications.cin as AdminUserDetail['verifications']['cin'],
      licence: dto.verifications.licence as AdminUserDetail['verifications']['licence'],
    },
    last_seen_at: dto.last_seen_at,
  };
}

export type AdminUsersSearch = {
  q?: string;
  role?: UserRole;
  status?: UserStatus;
};

/** `GET /admin/users?q=&role=&status=&cursor=&limit=` — matches phone, email, first or last name. */
export async function searchUsers(
  search: AdminUsersSearch,
  cursor: string | null | undefined,
  options?: RequestOptions,
): Promise<CursorPage<AdminUserSummary>> {
  const page = await apiGet<PaginatedResponse<AdminUserSummaryResponse>>(
    '/admin/users',
    { ...search, ...toCursorParams(cursor) },
    options,
  );
  return {
    items: page.items.map(toSummary),
    next_cursor: page.next_cursor,
    total: page.total,
  };
}

/** `GET /admin/users/{id}` — profile, verification statuses, stats. */
export async function getUserDetail(id: string, options?: RequestOptions): Promise<AdminUserDetail> {
  return toDetail(await apiGet<AdminUserDetailResponse>(`/admin/users/${id}`, undefined, options));
}

/** `PATCH /admin/users/{id}/status` — suspend, reactivate, or (soft) delete. */
export async function setUserStatus(
  id: string,
  status: UserStatus,
  reason: string | undefined,
  options?: RequestOptions,
): Promise<AdminUserDetail> {
  return toDetail(
    await apiPatch<AdminUserDetailResponse>(`/admin/users/${id}/status`, { status, reason }, options),
  );
}

/** `PATCH /admin/users/{id}/role` — any role, including `admin`/`support`. */
export async function setUserRole(
  id: string,
  role: UserRole,
  options?: RequestOptions,
): Promise<AdminUserDetail> {
  return toDetail(await apiPatch<AdminUserDetailResponse>(`/admin/users/${id}/role`, { role }, options));
}
