import { apiPost } from '@/api/request';
import type { AuthSession, PhoneAuthChallenge } from '@/types/models';

/**
 * Auth endpoints — `API Rakeb.md` §1.
 *
 * Every call here is `skipAuth`, with one exception: `/auth/register` runs
 * *with* the bearer token, because by the time a user reaches Register,
 * `/auth/phone/verify` has already handed out a session (see
 * `docs/API_FRONTEND_ANALYSIS.md` §4) — completing the profile is an
 * authenticated action, not a second sign-in.
 *
 * Implemented: phone start, phone verify, phone resend, register, login,
 * password forgot, refresh, logout.
 * Not implemented (add below, following the same shape):
 *   POST /auth/password/reset · GET /auth/email/verify
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

export type ResendPhoneOtpPayload = {
  otp_token: string;
};

/** `POST /auth/phone/resend` — rate-limited server-side (60 s, 3 max). */
export function resendPhoneOtp(payload: ResendPhoneOtpPayload): Promise<PhoneAuthChallenge> {
  return apiPost<PhoneAuthChallenge>('/auth/phone/resend', payload, { skipAuth: true });
}

export type RegisterPayload = {
  email: string;
  password: string;
  marketing_opt_in: boolean;
};

/** `POST /auth/register` — completes the profile opened by phone verification. */
export function registerAccount(payload: RegisterPayload): Promise<void> {
  return apiPost<void>('/auth/register', payload);
}

export type LoginPayload = {
  email: string;
  password: string;
};

/** `POST /auth/login` — the email/password alternative to the phone/OTP flow. */
export function login(payload: LoginPayload): Promise<AuthSession> {
  return apiPost<AuthSession>('/auth/login', payload, { skipAuth: true });
}

export type ForgotPasswordPayload = {
  email: string;
};

/**
 * `POST /auth/password/forgot` — always resolves the same way whether or not
 * the address has an account, so the screen can never use it to enumerate
 * emails.
 */
export function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
  return apiPost<void>('/auth/password/forgot', payload, { skipAuth: true });
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
