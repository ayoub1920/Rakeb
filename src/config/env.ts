/**
 * The single place in the app that reads `process.env`.
 *
 * Expo inlines `process.env.EXPO_PUBLIC_*` at build time, but only when the
 * member expression is written out literally — `process.env[key]` is NOT
 * replaced and resolves to `undefined` in a release bundle. That is the reason
 * every variable below is spelled out, and the reason nothing else in the app
 * may touch `process.env` (enforced by an ESLint rule).
 *
 * Everything here is public. `EXPO_PUBLIC_` values ship inside the JavaScript
 * bundle, so no secret ever belongs in this file.
 */

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value === 'true' || value === '1';
}

function readUrl(value: string | undefined, fallback: string): string {
  const raw = value?.trim();
  if (!raw) return fallback;
  // A trailing slash would produce `//v1` once the API prefix is appended.
  return raw.replace(/\/+$/, '');
}

const DEFAULT_API_URL = 'http://localhost:3000';
const DEFAULT_WS_URL = 'http://localhost:3000';

export type AppEnv = {
  /** Base URL of the NestJS API, without the `/v1` prefix. */
  apiUrl: string;
  /** Socket.IO server URL used by trip tracking and conversations. */
  wsUrl: string;
  /** Serve every request from local fixtures instead of the network. */
  enableMockApi: boolean;
  /** Expose development-only routes such as the route index. */
  enableDevRoutes: boolean;
  /** Start already authenticated with a fake session. Development only. */
  devAuthMode: boolean;
  /** Metro development build. */
  isDevelopment: boolean;
};

export const env: AppEnv = {
  apiUrl: readUrl(process.env.EXPO_PUBLIC_API_URL, DEFAULT_API_URL),
  wsUrl: readUrl(process.env.EXPO_PUBLIC_WS_URL, DEFAULT_WS_URL),
  enableMockApi: readBoolean(process.env.EXPO_PUBLIC_ENABLE_MOCK_API, false),
  enableDevRoutes: readBoolean(process.env.EXPO_PUBLIC_ENABLE_DEV_ROUTES, false),
  devAuthMode: readBoolean(process.env.EXPO_PUBLIC_DEV_AUTH_MODE, false),
  isDevelopment: __DEV__,
};

/**
 * Guards that only make sense at runtime, kept out of the object literal so the
 * values above stay trivially readable.
 */
export function assertEnvIsUsable(): void {
  if (!env.enableMockApi && env.apiUrl === DEFAULT_API_URL && !env.isDevelopment) {
    console.warn(
      '[env] EXPO_PUBLIC_API_URL is not set; falling back to localhost in a production build.',
    );
  }
  if (env.devAuthMode && !env.isDevelopment) {
    throw new Error('[env] EXPO_PUBLIC_DEV_AUTH_MODE must never be enabled in a production build.');
  }
}
