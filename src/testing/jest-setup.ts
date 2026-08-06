/**
 * Test environment setup.
 *
 * `jest-expo` mocks most Expo native modules already. The ones below either are
 * not covered or need behaviour rather than a stub — SecureStore in particular,
 * because session restoration reads from it on every mount.
 */

// SecureStore has no JS fallback; without this every auth test hits a native
// module that does not exist in Node. An in-memory map keeps `write` → `read`
// round trips honest.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    isAvailableAsync: jest.fn(async () => true),
  };
});

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'fr', languageTag: 'fr-TN', regionCode: 'TN' }],
  getCalendars: () => [{ timeZone: 'Africa/Tunis' }],
}));

// Keep test output readable: the logger's warnings about missing mock routes
// are expected in tests that exercise error paths.
jest.spyOn(console, 'warn').mockImplementation(() => {});
