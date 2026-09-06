import { QUERY_SCOPES } from '@/api/query-keys';

/** Query keys owned by the wallet feature. */
export const walletKeys = {
  all: [QUERY_SCOPES.wallet] as const,
  balance: () => [QUERY_SCOPES.wallet, 'balance'] as const,
  transactions: () => [QUERY_SCOPES.wallet, 'transactions'] as const,
};
