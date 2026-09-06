import { apiPost, apiPut } from '@/api/request';
import { CLIENT_ERROR_CODES, type ApiError, type RequestOptions } from '@/types/api';
import type { SignedUploadResponse, UploadResponse } from '@/types/api-responses';

/**
 * Object storage — `POST /uploads/sign`, `POST /uploads/{id}/confirm`.
 *
 * The backend hands back a short-lived pre-signed `PUT` URL (S3/MinIO). The
 * `PUT` itself still goes through `apiPut` (i.e. `apiClient`) rather than a
 * bare `fetch`: axios treats an absolute URL as an override of `baseURL` —
 * MinIO's URL is used as-is — and mock mode can only ever answer a request
 * that actually reaches the adapter it installed on `apiClient`; a raw
 * `fetch` would just try (and fail) to hit the network. `skipAuth` drops the
 * app's bearer token, which the bucket neither needs nor recognizes.
 *
 * `uploadFile` is the whole three-step round trip other features call:
 * `features/profile/api.ts` for the licence document today, and the same
 * shape for an avatar or a vehicle photo whenever those are wired.
 */

export type UploadPurpose =
  | 'avatar'
  | 'cin_front'
  | 'cin_back'
  | 'licence_front'
  | 'licence_back'
  | 'vehicle_photo'
  | 'support_attachment';

/** A document picked on-device — from `expo-image-picker` — not yet uploaded. */
export type PickedFile = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

function uploadFailed(message: string): ApiError {
  return { code: CLIENT_ERROR_CODES.UNKNOWN, message };
}

function signUpload(
  purpose: UploadPurpose,
  mimeType: string,
  sizeBytes: number,
  options?: RequestOptions,
): Promise<SignedUploadResponse> {
  return apiPost<SignedUploadResponse>(
    '/uploads/sign',
    { purpose, mime_type: mimeType, size_bytes: sizeBytes },
    options,
  );
}

function confirmUpload(uploadId: string, options?: RequestOptions): Promise<UploadResponse> {
  return apiPost<UploadResponse>(`/uploads/${uploadId}/confirm`, undefined, options);
}

/**
 * Signs, uploads and confirms a picked file. Returns the `upload_id` a
 * submitting endpoint (e.g. `POST /me/verifications/licence`) expects.
 *
 * Reads the file into a `Blob` first so the exact byte count backs both the
 * signature (`size_bytes` in `POST /uploads/sign`) and the `PUT` body —
 * a mismatch between the two is what a signed upload rejects.
 */
export async function uploadFile(
  purpose: UploadPurpose,
  file: PickedFile,
  options?: RequestOptions,
): Promise<string> {
  const blob = await (await fetch(file.uri)).blob();
  const mimeType = file.mimeType || blob.type || 'application/octet-stream';

  const signed = await signUpload(purpose, mimeType, blob.size, options);

  try {
    await apiPut(signed.url, blob, { ...options, skipAuth: true, headers: signed.headers });
  } catch {
    throw uploadFailed('Le téléversement du document a échoué. Réessayez.');
  }

  await confirmUpload(signed.upload_id, options);
  return signed.upload_id;
}
