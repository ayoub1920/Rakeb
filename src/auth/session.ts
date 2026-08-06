import { logout as logoutRequest, refreshSession } from '@/features/auth/api';
import { useAuthStore } from '@/stores/auth-store';
import { createLogger } from '@/utils/logger';

import { getDevSession } from './dev-auth';
import { tokenStorage, type StoredTokens } from './token-storage';

/**
 * Session lifecycle: restore, persist, refresh, clear.
 *
 * This is the only module that writes to both SecureStore and the auth store,
 * which is what keeps the two from drifting.
 *
 * It imports the auth endpoints from `features/auth/api` rather than defining
 * its own: every HTTP call in the app lives in a feature, without exception.
 */

const log = createLogger('session');

/**
 * Reads a persisted session at startup and pushes it into the auth store.
 *
 * It does not validate the token against the server — the first authenticated
 * query does that, and a 401 there triggers the refresh flow. Blocking the
 * splash screen on a network round trip would make a cold start on a slow
 * connection feel broken.
 */
export async function restoreSession(): Promise<void> {
  const store = useAuthStore.getState();

  const devSession = getDevSession();
  if (devSession) {
    store.setSession(devSession);
    return;
  }

  const tokens = await tokenStorage.read();
  if (!tokens) {
    store.setUnauthenticated();
    return;
  }

  store.setSession(tokens);
  log.debug('Session restored from secure storage.');
}

/** Called after a successful sign-in. Persists first, then flips the status. */
export async function startSession(tokens: StoredTokens): Promise<void> {
  await tokenStorage.write(tokens);
  useAuthStore.getState().setSession(tokens);
}

/**
 * Clears the session everywhere.
 *
 * `notifyServer` is false when the server is the one that rejected us — there
 * is no point revoking a refresh token the API already considers dead.
 *
 * TODO (when devices are wired): also `DELETE /me/devices/{id}` so the push
 * token stops receiving this account's notifications.
 */
export async function endSession({ notifyServer = true } = {}): Promise<void> {
  const { refreshToken } = useAuthStore.getState();

  if (notifyServer && refreshToken) {
    try {
      await logoutRequest(refreshToken);
    } catch (error) {
      // Sign-out must succeed locally even if the network call does not.
      log.warn('Logout request failed; clearing the local session anyway.', error);
    }
  }

  await tokenStorage.clear();
  useAuthStore.getState().clearSession();
}

/**
 * Single-flight token refresh.
 *
 * Concurrent 401s share one in-flight promise. Without this, a screen with four
 * parallel queries would fire four refreshes, and with refresh-token rotation
 * three of them would be rejected — logging the user out mid-session.
 */
let inFlightRefresh: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  inFlightRefresh ??= performRefresh().finally(() => {
    inFlightRefresh = null;
  });
  return inFlightRefresh;
}

async function performRefresh(): Promise<string | null> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return null;

  try {
    const tokens = await refreshSession(refreshToken);
    const next: StoredTokens = {
      accessToken: tokens.access_token,
      // The API may or may not rotate the refresh token; keep the old one when it does not.
      refreshToken: tokens.refresh_token ?? refreshToken,
    };
    await tokenStorage.write(next);
    useAuthStore.getState().setSession(next);
    log.debug('Access token refreshed.');
    return next.accessToken;
  } catch (error) {
    log.warn('Token refresh failed; the session is over.', error);
    await tokenStorage.clear();
    useAuthStore.getState().clearSession();
    return null;
  }
}

/** Test helper — drops any in-flight refresh between cases. */
export function resetRefreshState(): void {
  inFlightRefresh = null;
}
