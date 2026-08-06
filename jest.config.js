/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // Runs before any module is imported — sets EXPO_PUBLIC_* so the API layer
  // installs the mock adapter instead of reaching the network.
  setupFiles: ['<rootDir>/src/testing/jest-env.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/testing/jest-setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
  // The router smoke test mounts the whole app tree; 5 s is not enough for it
  // on a cold Metro-less transform cache.
  testTimeout: 20_000,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/testing/**',
    '!src/api/mock/**',
  ],
};
