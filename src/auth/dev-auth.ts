import { env } from '@/config/env';
import { createLogger } from '@/utils/logger';

import type { StoredTokens } from './token-storage';

/**
 * Development authentication.
 *
 * Enabled only by `EXPO_PUBLIC_DEV_AUTH_MODE=true`, so the app starts past the
 * login flow while auth screens are still placeholders. It is opt-in and
 * explicit — there is no permanently faked user, and `assertEnvIsUsable()`
 * refuses to start a production build with it on.
 *
 * The tokens are obvious fakes. Against a real backend every request will 401,
 * which is the intended signal that dev auth mode is not a substitute for
 * signing in.
 */

const log = createLogger('dev-auth');

const DEV_TOKENS: StoredTokens = {
  accessToken: 'dev-access-token',
  refreshToken: 'dev-refresh-token',
};

export function isDevAuthEnabled(): boolean {
  return env.devAuthMode && env.isDevelopment;
}

export function getDevSession(): StoredTokens | null {
  if (!isDevAuthEnabled()) return null;
  log.warn('EXPO_PUBLIC_DEV_AUTH_MODE is on — starting with a fake session.');
  return DEV_TOKENS;
}
