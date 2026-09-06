/**
 * Transport-level types shared by every feature.
 *
 * These describe the *envelope* the API speaks (errors, pagination), not the
 * domain. Domain shapes live in `./models.ts` and are meant to be replaced by
 * types generated from the NestJS OpenAPI document.
 */

/**
 * The normalized error every API call rejects with.
 *
 * `code`, `message` and `field` come from the backend contract
 * (`{ code, message, field? }`). `status` and `requestId` are added by the
 * client because both are needed to decide retryability and to file a support
 * ticket, and neither is part of the response body.
 */
export type ApiError = {
  code: string;
  message: string;
  field?: string;
  status?: number;
  requestId?: string;
};

/** Error codes the client itself produces, distinct from any backend code. */
export const CLIENT_ERROR_CODES = {
  NETWORK: 'network_error',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled',
  UNKNOWN: 'unknown_error',
  UNAUTHORIZED: 'unauthorized',
  NOT_IMPLEMENTED: 'not_implemented',
} as const;

export type ClientErrorCode = (typeof CLIENT_ERROR_CODES)[keyof typeof CLIENT_ERROR_CODES];

/** Request parameters for a cursor-paginated endpoint: `?cursor=&limit=20`. */
export type CursorParams = {
  cursor?: string | null;
  limit?: number;
};

/**
 * Response envelope for a cursor-paginated endpoint.
 *
 * The backend document specifies the request side (`?cursor=&limit=`) but not
 * the response shape; this is the assumed envelope. See open question 1 in
 * `docs/API_FRONTEND_ANALYSIS.md` — confirm before wiring real screens.
 */
export type CursorPage<T> = {
  items: T[];
  next_cursor: string | null;
  /** Only some endpoints return it — `/trips/search` documents a `total`. */
  total?: number;
};

/** Per-call options accepted by the thin `apiGet` / `apiPost` wrappers. */
export type RequestOptions = {
  /** Send the request without an `Authorization` header. */
  skipAuth?: boolean;
  /** Do not attempt a token refresh on 401 (used by the refresh call itself). */
  skipRefresh?: boolean;
  signal?: AbortSignal;
  /** Extra per-request headers, e.g. `Idempotency-Key` on `POST /bookings`. */
  headers?: Record<string, string>;
};
