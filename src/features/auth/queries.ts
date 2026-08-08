import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/auth/use-auth';
import type { ApiError } from '@/types/api';
import type { AuthSession, PhoneAuthChallenge } from '@/types/models';

import {
  forgotPassword,
  login,
  registerAccount,
  resendPhoneOtp,
  startPhoneAuth,
  verifyPhoneOtp,
  type ForgotPasswordPayload,
  type LoginPayload,
  type RegisterPayload,
  type ResendPhoneOtpPayload,
  type StartPhoneAuthPayload,
  type VerifyPhoneOtpPayload,
} from './api';

/**
 * Auth mutations.
 *
 * Auth has no queries — there is nothing to cache before a session exists, and
 * the current user is `features/profile`'s concern once there is one.
 */

/** `POST /auth/phone/start`. The screen keeps `otp_token` and routes to the OTP step. */
export function useStartPhoneAuth() {
  return useMutation<PhoneAuthChallenge, ApiError, StartPhoneAuthPayload>({
    mutationFn: startPhoneAuth,
  });
}

/**
 * `POST /auth/phone/verify`.
 *
 * On success the session is stored here rather than in the screen, so every
 * entry point into an authenticated state goes through `signIn` — that is what
 * makes SecureStore, the auth store and the router redirect stay in agreement.
 *
 * The screen still branches on `is_new_user` to route to Register.
 */
export function useVerifyPhoneOtp() {
  const { signIn } = useAuth();

  return useMutation<AuthSession, ApiError, VerifyPhoneOtpPayload>({
    mutationFn: verifyPhoneOtp,
    onSuccess: async (session) => {
      await signIn({
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      });
    },
  });
}

/** `POST /auth/phone/resend`. Returns a fresh `resend_after` for the cooldown. */
export function useResendPhoneOtp() {
  return useMutation<PhoneAuthChallenge, ApiError, ResendPhoneOtpPayload>({
    mutationFn: resendPhoneOtp,
  });
}

/**
 * `POST /auth/register`.
 *
 * Runs against the session `/auth/phone/verify` already opened — see
 * `features/auth/api.ts`. It does not call `signIn` itself: the session was
 * started by the OTP step, this only completes the profile attached to it.
 */
export function useRegister() {
  return useMutation<void, ApiError, RegisterPayload>({
    mutationFn: registerAccount,
  });
}

/** `POST /auth/login`. The email/password alternative to phone + OTP. */
export function useLogin() {
  const { signIn } = useAuth();

  return useMutation<AuthSession, ApiError, LoginPayload>({
    mutationFn: login,
    onSuccess: async (session) => {
      await signIn({
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      });
    },
  });
}

/** `POST /auth/password/forgot`. */
export function useForgotPassword() {
  return useMutation<void, ApiError, ForgotPasswordPayload>({
    mutationFn: forgotPassword,
  });
}
