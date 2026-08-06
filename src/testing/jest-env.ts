/**
 * Runs before any module is imported (`setupFiles`, not `setupFilesAfterEach`).
 *
 * `src/config/env.ts` reads `process.env` at module scope, so these have to be
 * set before the first import of anything that touches the API layer.
 * Tests therefore always run against the mock adapter — never the network.
 */
process.env.EXPO_PUBLIC_ENABLE_MOCK_API = 'true';
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';
process.env.EXPO_PUBLIC_WS_URL = 'http://localhost:3000';
process.env.EXPO_PUBLIC_ENABLE_DEV_ROUTES = 'false';
process.env.EXPO_PUBLIC_DEV_AUTH_MODE = 'false';
