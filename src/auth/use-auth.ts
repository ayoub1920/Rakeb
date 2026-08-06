import { useContext } from 'react';

import { useAuthStore } from '@/stores/auth-store';

import { AuthContext, type AuthContextValue } from './AuthProvider';

/**
 * Session actions and status.
 *
 * Use this when a component needs `signIn` / `signOut`. When it only needs to
 * *read* the status, prefer `useAuthStatus()` — it subscribes to the store
 * directly and re-renders on fewer changes.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      'useAuth must be used inside <AuthProvider>. Check src/providers/AppProviders.',
    );
  }
  return context;
}

export function useAuthStatus() {
  return useAuthStore((state) => state.status);
}

export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.status === 'authenticated');
}
