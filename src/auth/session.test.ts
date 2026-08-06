import { getAccessToken, resetAuthStore, useAuthStore } from '@/stores/auth-store';

import { endSession, startSession } from './session';
import { tokenStorage } from './token-storage';

jest.mock('@/features/auth/api', () => ({
  logout: jest.fn(async () => undefined),
  refreshSession: jest.fn(),
}));

const TOKENS = { accessToken: 'access-1', refreshToken: 'refresh-1' };

describe('sign-out', () => {
  beforeEach(async () => {
    resetAuthStore();
    await tokenStorage.clear();
  });

  it('clears the store and secure storage', async () => {
    await startSession(TOKENS);

    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(getAccessToken()).toBe('access-1');
    await expect(tokenStorage.read()).resolves.toEqual(TOKENS);

    await endSession();

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(getAccessToken()).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
    await expect(tokenStorage.read()).resolves.toBeNull();
  });

  it('signs out locally even when the logout request fails', async () => {
    const { logout } = jest.requireMock('@/features/auth/api') as {
      logout: jest.Mock;
    };
    logout.mockRejectedValueOnce(new Error('offline'));

    await startSession(TOKENS);
    await endSession();

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    await expect(tokenStorage.read()).resolves.toBeNull();
  });
});
