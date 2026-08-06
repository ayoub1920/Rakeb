import { registerAuthBridge } from '@/api/auth-bridge';
import { getAccessToken } from '@/stores/auth-store';

import { endSession, refreshAccessToken } from './session';

/**
 * Wires the session layer into the Axios client.
 *
 * This runs at *module load*, not in an effect. React runs child effects before
 * parent effects, so a screen's first query can fire before `AuthProvider`'s
 * `useEffect` would have registered the bridge — the request would then go out
 * without an `Authorization` header. Registering on import removes the race
 * entirely.
 *
 * Imported for its side effect by `AuthProvider`.
 */
registerAuthBridge({
  getAccessToken,
  refreshAccessToken,
  onSessionExpired: () => {
    // The API already rejected the refresh token; revoking it again is pointless.
    void endSession({ notifyServer: false });
  },
});
