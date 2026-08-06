import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useEffect, useMemo, type ReactNode } from 'react';

import { useAuthStore, type AuthStatus } from '@/stores/auth-store';
import { createLogger } from '@/utils/logger';

import './auth-bridge-setup';
import { endSession, restoreSession, startSession } from './session';
import type { StoredTokens } from './token-storage';

/**
 * Owns the session lifecycle: restore it at startup, expose sign-in/sign-out,
 * and drop cached server data when it ends.
 *
 * The *state* lives in `stores/auth-store` (so non-React code such as the Axios
 * interceptor can read it synchronously). The provider owns the side effects,
 * which is why the two are separate files.
 */

const log = createLogger('auth');

export type AuthContextValue = {
  status: AuthStatus;
  /** Still restoring a persisted session — render a splash, do not redirect. */
  isRestoring: boolean;
  isAuthenticated: boolean;
  /** Called by the OTP / login screens once the API returns tokens. */
  signIn(tokens: StoredTokens): Promise<void>;
  signOut(): Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    void restoreSession();
  }, []);

  // Any transition into "signed out" — an explicit sign-out, or a refresh
  // failure raised from the Axios interceptor — must drop every cached
  // response. Otherwise the next account to sign in on this device briefly
  // sees the previous one's trips.
  useEffect(() => {
    if (status === 'unauthenticated') {
      queryClient.clear();
    }
  }, [status, queryClient]);

  const signIn = useCallback(async (tokens: StoredTokens) => {
    await startSession(tokens);
    log.info('Signed in.');
  }, []);

  const signOut = useCallback(async () => {
    await endSession();
    log.info('Signed out.');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isRestoring: status === 'loading',
      isAuthenticated: status === 'authenticated',
      signIn,
      signOut,
    }),
    [status, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
