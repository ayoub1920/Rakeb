import { toCursorParams } from '@/api/pagination';
import { apiGet, apiPost } from '@/api/request';
import type { CursorPage, RequestOptions } from '@/types/api';
import type { AdminVerificationResponse, PaginatedResponse } from '@/types/api-responses';
import type { LicenceReviewStatus, LicenceVerification } from '@/types/models';

/**
 * Admin review of driver's licence submissions — `rakeb-backend`
 * `src/modules/admin/admin-verifications.controller.ts`.
 *
 * Not in `API Rakeb.md` (that document predates this feature). The endpoint
 * is shared with CIN review (`type: 'cin' | 'licence'`); this app only
 * surfaces `licence`, so every call here pins `type=licence`. Every handler
 * requires the `admin` or `support` role — the backend enforces that, never
 * this client (`src/common/guards/roles.guard.ts` in `rakeb-backend`).
 */

const TYPE = 'licence';

function toLicenceVerification(dto: AdminVerificationResponse): LicenceVerification {
  return {
    id: dto.id,
    user: {
      id: dto.user_id,
      display_name: dto.display_name,
      phone: dto.phone,
    },
    status: dto.status as LicenceReviewStatus,
    document_last4: dto.document_last4,
    front_document_url: dto.front_upload_url,
    submitted_at: dto.submitted_at,
    reviewed_at: dto.reviewed_at,
    rejection_reason: dto.rejection_reason,
    reviewed_by_user_id: dto.reviewed_by_user_id,
  };
}

/** `GET /admin/verifications?type=licence&status=&cursor=&limit=` — `pending` by default. */
export async function getLicenceVerifications(
  status: LicenceReviewStatus | undefined,
  cursor: string | null | undefined,
  options?: RequestOptions,
): Promise<CursorPage<LicenceVerification>> {
  const page = await apiGet<PaginatedResponse<AdminVerificationResponse>>(
    '/admin/verifications',
    { type: TYPE, status, ...toCursorParams(cursor) },
    options,
  );
  return {
    items: page.items.map(toLicenceVerification),
    next_cursor: page.next_cursor,
    total: page.total,
  };
}

/** `GET /admin/verifications/{userId}/licence`. */
export async function getLicenceVerification(
  userId: string,
  options?: RequestOptions,
): Promise<LicenceVerification> {
  const dto = await apiGet<AdminVerificationResponse>(
    `/admin/verifications/${userId}/${TYPE}`,
    undefined,
    options,
  );
  return toLicenceVerification(dto);
}

/** `POST /admin/verifications/{userId}/licence/review` — the whole approve/reject action. */
function review(
  userId: string,
  status: 'approved' | 'rejected',
  reason?: string,
  options?: RequestOptions,
): Promise<void> {
  return apiPost<void>(
    `/admin/verifications/${userId}/${TYPE}/review`,
    { status, reason },
    options,
  );
}

export function approveLicenceVerification(userId: string, options?: RequestOptions): Promise<void> {
  return review(userId, 'approved', undefined, options);
}

/** A reason is required — `rakeb-backend`'s `AdminReviewVerificationDto` doesn't enforce it, but the UI does. */
export function rejectLicenceVerification(
  userId: string,
  reason: string,
  options?: RequestOptions,
): Promise<void> {
  return review(userId, 'rejected', reason, options);
}
