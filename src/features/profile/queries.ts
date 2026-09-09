import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { getNextCursor, INITIAL_CURSOR } from '@/api/pagination';
import { STALE_TIME } from '@/api/query-client';
import { refreshAccessToken } from '@/auth/session';
import { useIsAuthenticated } from '@/auth/use-auth';
import type { PickedFile } from '@/features/uploads/api';
import type { ApiError, CursorPage } from '@/types/api';
import type {
  PublicProfile,
  TravelPreferences,
  User,
  UserReview,
  UserRole,
  Verifications,
} from '@/types/models';

import {
  devBecomeAdmin,
  getCurrentUser,
  getPreferences,
  getPublicProfile,
  getUserReviews,
  getVerifications,
  setPreferences,
  submitLicence,
  updateAvatar,
  updateProfile,
  updateRole,
  type UpdateProfileInput,
} from './api';
import { profileKeys } from './keys';

/** `GET /users/{id}` — another member's public profile. */
export function usePublicProfile(userId: string) {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<PublicProfile, ApiError>({
    queryKey: profileKeys.publicProfile(userId),
    queryFn: ({ signal }) => getPublicProfile(userId, { signal }),
    enabled: isAuthenticated && userId.length > 0,
    staleTime: STALE_TIME.session,
  });
}

/** `GET /users/{id}/reviews`. */
export function useUserReviews(userId: string) {
  const isAuthenticated = useIsAuthenticated();

  return useInfiniteQuery<CursorPage<UserReview>, ApiError>({
    queryKey: [...profileKeys.publicProfile(userId), 'reviews'],
    queryFn: ({ pageParam, signal }) =>
      getUserReviews(userId, pageParam as string | null, { signal }),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: getNextCursor,
    enabled: isAuthenticated && userId.length > 0,
    staleTime: STALE_TIME.session,
  });
}

/**
 * `GET /me`.
 *
 * Gated on the auth status: firing it while signed out would produce a
 * guaranteed 401, an attempted refresh, and a redirect the router is already
 * handling.
 */
export function useCurrentUser() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<User, ApiError>({
    queryKey: profileKeys.currentUser(),
    queryFn: ({ signal }) => getCurrentUser({ signal }),
    enabled: isAuthenticated,
    staleTime: STALE_TIME.session,
  });
}

/**
 * `GET /me/verifications`.
 *
 * The publish wizard checks `can_publish` before its first step, so this is
 * fetched there rather than at the final submit.
 */
export function useVerifications() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<Verifications, ApiError>({
    queryKey: profileKeys.verifications(),
    queryFn: ({ signal }) => getVerifications({ signal }),
    enabled: isAuthenticated,
    staleTime: STALE_TIME.session,
    refetchOnMount: 'always',
  });
}

/**
 * Whether the signed-in user is staff.
 *
 * `role` is server data (`GET /me`), not session state, so this reads the same
 * query the rest of the app already caches rather than adding a second source
 * of truth. Used by the admin route group's guard (`app/admin/_layout.tsx`) —
 * that guard is UX only; every admin endpoint enforces the role itself.
 *
 * Both `admin` and `support` pass the backend's `@Roles(ADMIN, SUPPORT)` gate
 * on `/admin/verifications/*` (`admin-verifications.controller.ts`), so both
 * see this screen.
 */
export function useIsAdmin(): boolean {
  const { data: user } = useCurrentUser();
  return user?.role === 'admin' || user?.role === 'support';
}

/**
 * `support` can search and view the user directory but not change anything —
 * `PATCH /admin/users/{id}/status` and `/role` are `@Roles(UserRole.ADMIN)`
 * only. `admin/users/[userId].tsx` uses this to hide (not just disable) the
 * suspend / delete / role-change actions for a `support` viewer.
 */
export function useIsFullAdmin(): boolean {
  const { data: user } = useCurrentUser();
  return user?.role === 'admin';
}

/** `PATCH /me/role` — used when a rider opts into offering trips. */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, UserRole>({
    mutationFn: (role) => updateRole(role),
    onSuccess: async (user) => {
      queryClient.setQueryData(profileKeys.currentUser(), user);
      // `PATCH /me/role` changes the DB row but not the caller's access token,
      // and the API's `RolesGuard` reads the role from that token's claim — not
      // the DB. Without this refresh, `POST /trips` keeps rejecting with
      // "Requires one of the roles: driver, both" until the token expires on
      // its own. `POST /auth/refresh` re-mints it with the current role.
      //
      // `endSessionOnFailure: false` — a transient failure of this proactive
      // refresh must not sign the user out; the next real 401 refreshes for real.
      await refreshAccessToken({ endSessionOnFailure: false });
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

/** `PATCH /me` — profile fields. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, UpdateProfileInput>({
    mutationFn: (input) => updateProfile(input),
    onSuccess: (user) => {
      queryClient.setQueryData(profileKeys.currentUser(), user);
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

/** `POST /me/avatar` — picks + uploads + sets in one step. */
export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation<{ avatar_url: string | null }, ApiError, PickedFile>({
    mutationFn: (image) => updateAvatar(image),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: profileKeys.currentUser() }),
  });
}

/** `GET /me/preferences`. */
export function usePreferences() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<TravelPreferences, ApiError>({
    queryKey: profileKeys.preferences(),
    queryFn: ({ signal }) => getPreferences({ signal }),
    enabled: isAuthenticated,
    staleTime: STALE_TIME.session,
  });
}

/** `PUT /me/preferences`. */
export function useSetPreferences() {
  const queryClient = useQueryClient();

  return useMutation<TravelPreferences, ApiError, TravelPreferences>({
    mutationFn: (prefs) => setPreferences(prefs),
    onSuccess: (prefs) => queryClient.setQueryData(profileKeys.preferences(), prefs),
  });
}

/**
 * `POST /me/verifications/licence`.
 *
 * Refetches rather than trusting the response to be the full picture: the
 * publish gate (`useVerifications`) must see `pending` the instant this
 * resolves, since that is what keeps the user from publishing while it is
 * under review.
 */
export function useSubmitLicence() {
  const queryClient = useQueryClient();

  return useMutation<Verifications, ApiError, PickedFile>({
    mutationFn: (document) => submitLicence(document),
    onSuccess: (verifications) => {
      queryClient.setQueryData(profileKeys.verifications(), verifications);
      void queryClient.invalidateQueries({ queryKey: profileKeys.verifications() });
    },
  });
}

/** `POST /dev/become-admin` — see `devBecomeAdmin` in `./api.ts`. Used only by `/dev`. */
export function useDevBecomeAdmin() {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, void>({
    mutationFn: () => devBecomeAdmin(),
    onSuccess: (user) => {
      queryClient.setQueryData(profileKeys.currentUser(), user);
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
