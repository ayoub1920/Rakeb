import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getNextCursor, INITIAL_CURSOR } from '@/api/pagination';
import { STALE_TIME } from '@/api/query-client';
import { useIsAuthenticated } from '@/auth/use-auth';
import { useIsAdmin } from '@/features/profile/queries';
import type { ApiError, CursorPage } from '@/types/api';
import type { AdminUserDetail, AdminUserSummary, UserRole, UserStatus } from '@/types/models';

import { getUserDetail, searchUsers, setUserRole, setUserStatus, type AdminUsersSearch } from './api';
import { adminUserKeys } from './keys';

/** `GET /admin/users?q=&role=&status=`. */
export function useAdminUsers(search: AdminUsersSearch) {
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();

  return useInfiniteQuery<CursorPage<AdminUserSummary>, ApiError>({
    queryKey: adminUserKeys.list(search),
    queryFn: ({ pageParam, signal }) => searchUsers(search, pageParam as string | null, { signal }),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: getNextCursor,
    enabled: isAuthenticated && isAdmin,
    staleTime: STALE_TIME.volatile,
  });
}

/** `GET /admin/users/{id}`. */
export function useAdminUserDetail(id: string) {
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();

  return useQuery<AdminUserDetail, ApiError>({
    queryKey: adminUserKeys.detail(id),
    queryFn: ({ signal }) => getUserDetail(id, { signal }),
    enabled: isAuthenticated && isAdmin && Boolean(id),
    staleTime: STALE_TIME.volatile,
  });
}

/** `PATCH /admin/users/{id}/status` — suspend, reactivate, or (soft) delete. */
export function useSetUserStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation<AdminUserDetail, ApiError, { status: UserStatus; reason?: string }>({
    mutationFn: ({ status, reason }) => setUserStatus(id, status, reason),
    onSuccess: (user) => {
      queryClient.setQueryData(adminUserKeys.detail(id), user);
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
    },
  });
}

/** `PATCH /admin/users/{id}/role`. */
export function useSetUserRole(id: string) {
  const queryClient = useQueryClient();

  return useMutation<AdminUserDetail, ApiError, UserRole>({
    mutationFn: (role) => setUserRole(id, role),
    onSuccess: (user) => {
      queryClient.setQueryData(adminUserKeys.detail(id), user);
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
    },
  });
}
