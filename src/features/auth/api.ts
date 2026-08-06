import { apiPost } from '@/api/request';
import type { AuthSession, PhoneAuthChallenge } from '@/types/models';

/**
 * Auth endpoints — `API Rakeb.md` §1.
 *
 * Every call here is `skipAuth`: there is no session yet, and sending a stale
 * bearer token to `/auth/*` is how a refresh loop starts.
 *
 * Implemented: phone start, phone verify, refresh, logout.
 * Not implemented (add below, following the same shape):
 *   POST /auth/phone/resend · POST /auth/register · POST /auth/login
 *   POST /auth/password/forgot · POST /auth/password/reset
 *   GET  /auth/email/verify
 */

export type StartPhoneAuthPayload = {
  /** E.164, e.g. `+21698123456`. */
  phone: string;
};

/** `POST /auth/phone/start` — sends the OTP. */
export function startPhoneAuth(payload: StartPhoneAuthPayload): Promise<PhoneAuthChallenge> {
  return apiPost<PhoneAuthChallenge>('/auth/phone/start', payload, { skipAuth: true });
}

export type VerifyPhoneOtpPayload = {
  otp_token: string;
  code: string;
};

/**
 * `POST /auth/phone/verify` — exchanges the code for a session.
 * `is_new_user` decides whether the caller routes to Register or to Home.
 */
export function verifyPhoneOtp(payload: VerifyPhoneOtpPayload): Promise<AuthSession> {
  return apiPost<AuthSession>('/auth/phone/verify', payload, { skipAuth: true });
}

export type RefreshResponse = {
  access_token: string;
  /** Present only if the backend rotates refresh tokens. */
  refresh_token?: string;
};

/**
 * `POST /auth/refresh`.
 *
 * `skipRefresh` matters: without it, a 401 from this call would trigger another
 * refresh, and so on.
 */
export function refreshSession(refreshToken: string): Promise<RefreshResponse> {
  return apiPost<RefreshResponse>(
    '/auth/refresh',
    { refresh_token: refreshToken },
    { skipAuth: true, skipRefresh: true },
  );
}

/** `POST /auth/logout` — revokes the refresh token server-side. */
export function logout(refreshToken: string): Promise<void> {
  return apiPost<void>('/auth/logout', { refresh_token: refreshToken });
}
