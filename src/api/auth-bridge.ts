import { createLogger } from '@/utils/logger';

/**
 * The seam between `src/api` and `src/auth`.
 *
 * The Axios client needs three things from the session layer: the current
 * access token, a way to refresh it, and a way to report that the session is
 * unrecoverable. Importing `src/auth` from `src/api` would create a cycle
 * (`auth` → `features/auth/api` → `api/client` → `auth`), so the dependency is
 * inverted: `AuthProvider` registers its implementation at mount, and the
 * client only ever sees this interface.
 *
 * Before registration — during the first render, and in unit tests that touch
 * the client without a provider — the default implementation behaves like a
 * signed-out session rather than throwing.
 */

const log = createLogger('auth-bridge');

export type AuthBridge = {
  /** Current access token, or `null` when signed out. Synchronous by design:
   *  the request interceptor must not await SecureStore on every call. */
  getAccessToken(): string | null;
  /** Single-flight refresh. Resolves to the new access token, or `null` when
   *  the refresh token is gone or rejected. */
  refreshAccessToken(): Promise<string | null>;
  /** The session cannot be recovered — clear it and send the user to `(auth)`. */
  onSessionExpired(): void;
};

const signedOutBridge: AuthBridge = {
  getAccessToken: () => null,
  refreshAccessToken: async () => null,
  onSessionExpired: () => {
    log.debug('Session expired before AuthProvider registered a bridge.');
  },
};

let current: AuthBridge = signedOutBridge;

export function registerAuthBridge(bridge: AuthBridge): void {
  current = bridge;
}

export function resetAuthBridge(): void {
  current = signedOutBridge;
}

export function getAuthBridge(): AuthBridge {
  return current;
}
