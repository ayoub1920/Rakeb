import { apiGet, apiPatch, apiPost, apiPut } from '@/api/request';
import { uploadFile, type PickedFile } from '@/features/uploads/api';
import type { RequestOptions } from '@/types/api';
import type { AvatarResponse, PreferencesResponse, VerificationsResponse } from '@/types/api-responses';
import type {
  PreferenceLevel,
  TravelPreferences,
  User,
  UserRole,
  VerificationStatus,
  Verifications,
} from '@/types/models';

/**
 * Profile endpoints — `API Rakeb.md` §2.
 *
 * Not implemented (add here):
 *   GET /me/stats
 *   GET /users/{id} · GET /users/{id}/reviews
 *   POST /me/verifications/cin
 */

function toVerifications(dto: VerificationsResponse): Verifications {
  return {
    phone: dto.phone as VerificationStatus,
    email: dto.email as VerificationStatus,
    cin: dto.cin as VerificationStatus,
    licence: dto.licence as VerificationStatus,
    licence_rejection_reason: dto.licence_rejection_reason,
    can_publish: dto.can_publish_trips,
  };
}

function toPreferences(dto: PreferencesResponse): TravelPreferences {
  return {
    chat: dto.chat as PreferenceLevel,
    music: dto.music as PreferenceLevel,
    smoking: dto.smoking as PreferenceLevel,
    pets: dto.pets as PreferenceLevel,
  };
}

/**
 * `GET /me` — the signed-in user.
 *
 * Also the session probe: a 401 here is what invalidates a session restored
 * from SecureStore, via the client's refresh-then-sign-out path.
 */
export function getCurrentUser(options?: RequestOptions): Promise<User> {
  return apiGet<User>('/me', undefined, options);
}

/** `PATCH /me/role` — `rider | driver | both`. Staff roles cannot be self-assigned. */
export function updateRole(role: UserRole, options?: RequestOptions): Promise<User> {
  return apiPatch<User>('/me/role', { role }, options);
}

export type UpdateProfileInput = {
  first_name?: string;
  last_name?: string;
  /** `yyyy-MM-dd`. */
  birth_date?: string;
  email?: string;
  bio?: string;
  locale?: string;
};

/** `PATCH /me` — first name, last name, birth date, e-mail, bio, locale. */
export function updateProfile(input: UpdateProfileInput, options?: RequestOptions): Promise<User> {
  return apiPatch<User>('/me', input, options);
}

/**
 * `POST /me/avatar` — the picked image goes through `features/uploads`
 * (sign → PUT → confirm, purpose `avatar`, public bucket) and only the
 * `upload_id` reaches this endpoint.
 */
export async function updateAvatar(
  image: PickedFile,
  options?: RequestOptions,
): Promise<AvatarResponse> {
  const uploadId = await uploadFile('avatar', image, options);
  return apiPost<AvatarResponse>('/me/avatar', { upload_id: uploadId }, options);
}

/** `GET /me/preferences` — chat / music / smoking / pets, each `yes | no | maybe`. */
export async function getPreferences(options?: RequestOptions): Promise<TravelPreferences> {
  return toPreferences(await apiGet<PreferencesResponse>('/me/preferences', undefined, options));
}

/** `PUT /me/preferences` — replaces all four. */
export async function setPreferences(
  prefs: TravelPreferences,
  options?: RequestOptions,
): Promise<TravelPreferences> {
  return toPreferences(await apiPut<PreferencesResponse>('/me/preferences', prefs, options));
}

/** `GET /me/verifications` — phone / email / CIN / licence status and the publish gate. */
export async function getVerifications(options?: RequestOptions): Promise<Verifications> {
  return toVerifications(await apiGet<VerificationsResponse>('/me/verifications', undefined, options));
}

/**
 * `POST /me/verifications/licence` — submits (or resubmits) the driver's
 * licence. Always moves the status to `pending`; the admin queue is what
 * decides `approved` / `rejected` next (`features/admin/licences`).
 *
 * The document itself goes through `features/uploads` first (sign → PUT to
 * the bucket → confirm) — this endpoint only ever sees the resulting
 * `front_upload_id`, never the file bytes.
 */
export async function submitLicence(
  document: PickedFile,
  options?: RequestOptions,
): Promise<Verifications> {
  const frontUploadId = await uploadFile('licence_front', document, options);
  const dto = await apiPost<VerificationsResponse>(
    '/me/verifications/licence',
    { front_upload_id: frontUploadId },
    options,
  );
  return toVerifications(dto);
}

/**
 * `POST /dev/become-admin` — mock-only, reachable from `/dev`.
 *
 * `PATCH /me/role` refuses `admin` on purpose (staff roles are never
 * self-assignable, in mock mode or for real). Against the real backend,
 * becoming admin goes through `pnpm admin:promote <phone> admin` in
 * `rakeb-backend` instead — there is no client-reachable endpoint for it,
 * and this mock-only route 404s there. `/dev` only shows the button when
 * mock mode is on (`env.enableMockApi`).
 */
export function devBecomeAdmin(options?: RequestOptions): Promise<User> {
  return apiPost<User>('/dev/become-admin', undefined, options);
}
