import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getNextCursor, INITIAL_CURSOR } from '@/api/pagination';
import { STALE_TIME } from '@/api/query-client';
import { useIsAuthenticated } from '@/auth/use-auth';
import type { ApiError, CursorPage } from '@/types/api';
import type { Id, Millimes, WalletBalance, WalletTransaction } from '@/types/models';

import {
  getWalletBalance,
  getWalletTransactions,
  topupWallet,
  withdrawFromWallet,
  type WithdrawInput,
} from './api';
import { walletKeys } from './keys';

/** `GET /wallet` — `STALE_TIME.realtime`: the balance moves with every trip. */
export function useWalletBalance() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<WalletBalance, ApiError>({
    queryKey: walletKeys.balance(),
    queryFn: ({ signal }) => getWalletBalance({ signal }),
    enabled: isAuthenticated,
    staleTime: STALE_TIME.realtime,
    refetchOnMount: 'always',
  });
}

/** `GET /wallet/transactions`. */
export function useWalletTransactions() {
  const isAuthenticated = useIsAuthenticated();

  return useInfiniteQuery<CursorPage<WalletTransaction>, ApiError>({
    queryKey: walletKeys.transactions(),
    queryFn: ({ pageParam, signal }) =>
      getWalletTransactions(pageParam as string | null, { signal }),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: getNextCursor,
    enabled: isAuthenticated,
    staleTime: STALE_TIME.volatile,
  });
}

function useWalletMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TVars>({
    mutationFn: fn,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: walletKeys.all }),
  });
}

/** `POST /wallet/topup`. */
export function useTopupWallet() {
  return useWalletMutation<{ amount: Millimes; paymentMethodId: Id }, unknown>(({ amount, paymentMethodId }) =>
    topupWallet(amount, paymentMethodId),
  );
}

/** `POST /wallet/withdraw`. */
export function useWithdrawFromWallet() {
  return useWalletMutation<WithdrawInput, unknown>((input) => withdrawFromWallet(input));
}
