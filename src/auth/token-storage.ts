import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { createLogger } from '@/utils/logger';

/**
 * Token persistence.
 *
 * Both tokens live in the OS keystore (Keychain on iOS, EncryptedSharedPreferences
 * on Android) through Expo SecureStore. AsyncStorage is not an option: it is
 * plaintext on disk, and a refresh token there is a permanent account takeover
 * on a rooted or backed-up device.
 *
 * SecureStore has no web implementation. Rather than crash `expo start --web`,
 * the web build falls back to an in-memory store — tokens do not survive a
 * reload there, which is acceptable for a development target and unacceptable
 * for production. If web ever ships, this is the file to revisit.
 */

const log = createLogger('token-storage');

const ACCESS_TOKEN_KEY = 'rakeb.access_token';
const REFRESH_TOKEN_KEY = 'rakeb.refresh_token';

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
};

/** The surface `token-storage` needs from a backend. Swappable for tests. */
export type TokenStorageAdapter = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

const secureStoreAdapter: TokenStorageAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

function createMemoryAdapter(): TokenStorageAdapter {
  const map = new Map<string, string>();
  return {
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => {
      map.set(key, value);
    },
    removeItem: async (key) => {
      map.delete(key);
    },
  };
}

const adapter: TokenStorageAdapter =
  Platform.OS === 'web' ? createMemoryAdapter() : secureStoreAdapter;

export const tokenStorage = {
  async read(): Promise<StoredTokens | null> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        adapter.getItem(ACCESS_TOKEN_KEY),
        adapter.getItem(REFRESH_TOKEN_KEY),
      ]);
      if (!accessToken || !refreshToken) return null;
      return { accessToken, refreshToken };
    } catch (error) {
      // A corrupted keystore entry must not brick the app: treat it as signed out.
      log.error('Failed to read tokens from secure storage', error);
      return null;
    }
  },

  async write(tokens: StoredTokens): Promise<void> {
    await Promise.all([
      adapter.setItem(ACCESS_TOKEN_KEY, tokens.accessToken),
      adapter.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
  },

  async clear(): Promise<void> {
    await Promise.all([
      adapter.removeItem(ACCESS_TOKEN_KEY),
      adapter.removeItem(REFRESH_TOKEN_KEY),
    ]);
  },
};
