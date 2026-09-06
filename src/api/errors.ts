import { AxiosError } from 'axios';

import { REQUEST_ID_HEADER } from '@/config/constants';
import { CLIENT_ERROR_CODES, type ApiError } from '@/types/api';

/**
 * Everything the app catches is an `ApiError`.
 *
 * The backend contract is `{ code, message, field? }`. This module widens it
 * with `status` and `requestId`, and maps transport failures (offline, timeout,
 * cancellation) onto the same shape, so no caller ever has to know whether it
 * is holding an `AxiosError`, a `TypeError` or a backend payload.
 */

const FALLBACK_MESSAGE = 'Une erreur est survenue. Veuillez réessayer.';

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ApiError).code === 'string' &&
    typeof (value as ApiError).message === 'string'
  );
}

/** Reads `{ code, message, field }` out of a backend error body, if present. */
function fromResponseBody(data: unknown): Partial<ApiError> | null {
  if (typeof data !== 'object' || data === null) return null;
  const body = data as Record<string, unknown>;
  const code = typeof body.code === 'string' ? body.code : undefined;
  const message = typeof body.message === 'string' ? body.message : undefined;
  const field = typeof body.field === 'string' ? body.field : undefined;
  if (!code && !message) return null;
  return { code, message, field };
}

function readRequestId(error: AxiosError): string | undefined {
  const fromResponse = error.response?.headers?.[REQUEST_ID_HEADER];
  if (typeof fromResponse === 'string') return fromResponse;
  const fromRequest = error.config?.headers?.[REQUEST_ID_HEADER];
  return typeof fromRequest === 'string' ? fromRequest : undefined;
}

/** Converts anything thrown by the network layer into an `ApiError`. */
export function normalizeError(error: unknown): ApiError {
  // `AxiosError` is checked first on purpose: it always carries its own
  // string `code` (`ERR_BAD_REQUEST`, …) and `message`, which satisfies
  // `isApiError`'s shape check too. Checking that first would return the raw
  // Axios error unchanged — generic message, transport code, no `field` —
  // instead of extracting the backend's actual `{ code, message, field }`
  // from `error.response.data` below.
  if (error instanceof AxiosError) {
    const requestId = readRequestId(error);

    if (error.code === AxiosError.ERR_CANCELED) {
      return { code: CLIENT_ERROR_CODES.CANCELLED, message: 'Requête annulée.', requestId };
    }

    if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT) {
      return {
        code: CLIENT_ERROR_CODES.TIMEOUT,
        message: 'Le serveur met trop de temps à répondre.',
        requestId,
      };
    }

    if (!error.response) {
      return {
        code: CLIENT_ERROR_CODES.NETWORK,
        message: 'Connexion impossible. Vérifiez votre connexion internet.',
        requestId,
      };
    }

    const body = fromResponseBody(error.response.data);
    return {
      code: body?.code ?? CLIENT_ERROR_CODES.UNKNOWN,
      message: body?.message ?? FALLBACK_MESSAGE,
      field: body?.field,
      status: error.response.status,
      requestId,
    };
  }

  // Not an `AxiosError` — an already-normalized `ApiError` passed back through
  // (e.g. a second `normalizeError` call) takes this path.
  if (isApiError(error)) return error;

  if (error instanceof Error) {
    return { code: CLIENT_ERROR_CODES.UNKNOWN, message: error.message || FALLBACK_MESSAGE };
  }

  return { code: CLIENT_ERROR_CODES.UNKNOWN, message: FALLBACK_MESSAGE };
}

/** The session is gone or was never valid. Triggers sign-out, not a retry. */
export function isUnauthorizedError(error: ApiError): boolean {
  return error.status === 401 || error.code === CLIENT_ERROR_CODES.UNAUTHORIZED;
}

/**
 * Whether retrying could plausibly succeed.
 *
 * 4xx responses are the client's fault and never retried — that includes 409
 * "no seats left", which is a normal outcome of booking a trip someone else
 * just filled, not a transient failure.
 */
export function isRetryableError(error: ApiError): boolean {
  if (error.code === CLIENT_ERROR_CODES.CANCELLED) return false;
  if (error.code === CLIENT_ERROR_CODES.NETWORK) return true;
  if (error.code === CLIENT_ERROR_CODES.TIMEOUT) return true;
  if (error.status === undefined) return false;
  return error.status >= 500;
}

/** Pairs with React Hook Form's `setError` for `{ field }` validation errors. */
export function getFieldError(error: unknown, field: string): string | null {
  const normalized = normalizeError(error);
  return normalized.field === field ? normalized.message : null;
}
