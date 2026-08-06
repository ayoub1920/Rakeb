import { apiGet } from '@/api/request';
import type { RequestOptions } from '@/types/api';
import type { User } from '@/types/models';

/**
 * Profile endpoints — `API Rakeb.md` §2.
 *
 * Not implemented (add here):
 *   PATCH /me · POST /me/avatar · PATCH /me/role
 *   GET · PUT /me/preferences · GET /me/stats
 *   GET /users/{id} · GET /users/{id}/reviews
 *   POST /me/verifications/cin · /licence · GET /me/verifications
 */

/**
 * `GET /me` — the signed-in user.
 *
 * Also the session probe: a 401 here is what invalidates a session restored
 * from SecureStore, via the client's refresh-then-sign-out path.
 */
export function getCurrentUser(options?: RequestOptions): Promise<User> {
  return apiGet<User>('/me', undefined, options);
}
