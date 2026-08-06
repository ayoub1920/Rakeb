import { create } from 'zustand';

/**
 * Session state.
 *
 * Holds only what the app needs synchronously: the auth status and the tokens.
 * The *user* is server data and belongs to TanStack Query (`GET /me` via
 * `features/profile`), not here — see the state-management rules in
 * `docs/FRONTEND_ARCHITECTURE.md`.
 *
 * Tokens are duplicated between this store and SecureStore on purpose: the
 * Axios request interceptor must read the access token synchronously, and
 * awaiting the keystore on every request would serialize the whole app.
 */

export type AuthStatus =
  /** Restoring a persisted session — render a splash, never a redirect. */
  'loading' | 'authenticated' | 'unauthenticated';

export type AuthState = {
  status: AuthStatus;
  accessToken: string | null;
  refreshToken: string | null;
};

export type AuthActions = {
  /** A sign-in or refresh succeeded. */
  setSession(tokens: { accessToken: string; refreshToken: string }): void;
  /** Only the access token changed (token refresh with a rotating refresh token off). */
  setAccessToken(accessToken: string): void;
  /** Signed out, or the session was rejected. */
  clearSession(): void;
  /** Bootstrap finished with no session to restore. */
  setUnauthenticated(): void;
};

const initialState: AuthState = {
  status: 'loading',
  accessToken: null,
  refreshToken: null,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  setSession: ({ accessToken, refreshToken }) =>
    set({ status: 'authenticated', accessToken, refreshToken }),

  setAccessToken: (accessToken) => set({ accessToken }),

  clearSession: () => set({ status: 'unauthenticated', accessToken: null, refreshToken: null }),

  setUnauthenticated: () => set({ status: 'unauthenticated' }),
}));

/** Non-reactive read, for code outside React such as the Axios auth bridge. */
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

export function getRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken;
}

/** Test helper — resets the store between cases. Merges, so actions survive. */
export function resetAuthStore(): void {
  useAuthStore.setState(initialState);
}
