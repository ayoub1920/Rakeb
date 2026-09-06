import { toCursorParams } from '@/api/pagination';
import { apiGet, apiPost } from '@/api/request';
import { createRequestId } from '@/api/request-id';
import type { CursorPage, RequestOptions } from '@/types/api';
import type {
  PaginatedResponse,
  TopupResponse,
  WalletBalanceResponse,
  WalletTransactionResponse,
  WithdrawResponse,
} from '@/types/api-responses';
import type {
  Id,
  Millimes,
  WalletBalance,
  WalletTransaction,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@/types/models';

/**
 * The Rakeb wallet — `API Rakeb.md` §11.
 *
 * `rakeb-backend` exposes the read endpoints on the `WalletController` in
 * `src/modules/wallet/wallet.module.ts` and the funding endpoints on the
 * `WalletFundingController` in `src/modules/payments/payments.controller.ts`.
 * Both `topup` and `withdraw` are idempotent — a fresh `Idempotency-Key` per
 * attempt, same rule as `POST /bookings`.
 */

function toTransaction(dto: WalletTransactionResponse): WalletTransaction {
  return {
    id: dto.id,
    type: dto.type as WalletTransactionType,
    status: dto.status as WalletTransactionStatus,
    amount: dto.amount,
    currency: dto.currency,
    description: dto.description,
    available_at: dto.available_at,
    created_at: dto.created_at,
  };
}

/** `GET /wallet` — available + pending balance. */
export async function getWalletBalance(options?: RequestOptions): Promise<WalletBalance> {
  const dto = await apiGet<WalletBalanceResponse>('/wallet', undefined, options);
  return { available: dto.available, pending: dto.pending, total: dto.total, currency: dto.currency };
}

/** `GET /wallet/transactions` — the ledger, newest first. */
export async function getWalletTransactions(
  cursor: string | null | undefined,
  options?: RequestOptions,
): Promise<CursorPage<WalletTransaction>> {
  const page = await apiGet<PaginatedResponse<WalletTransactionResponse>>(
    '/wallet/transactions',
    toCursorParams(cursor),
    options,
  );
  return {
    items: page.items.map(toTransaction),
    next_cursor: page.next_cursor,
    total: page.total,
  };
}

/** `POST /wallet/topup` — card or mobile money → wallet credit. */
export function topupWallet(
  amount: Millimes,
  paymentMethodId: Id,
  options?: RequestOptions,
): Promise<TopupResponse> {
  return apiPost<TopupResponse>(
    '/wallet/topup',
    { amount, payment_method_id: paymentMethodId },
    { ...options, headers: { 'Idempotency-Key': createRequestId() } },
  );
}

export type WithdrawInput = {
  amount: Millimes;
  destination_type: 'rib' | 'mobile_money';
  rib?: string;
  msisdn?: string;
};

/** `POST /wallet/withdraw` — reserves the funds; the payout settles asynchronously. */
export function withdrawFromWallet(
  input: WithdrawInput,
  options?: RequestOptions,
): Promise<WithdrawResponse> {
  return apiPost<WithdrawResponse>('/wallet/withdraw', input, {
    ...options,
    headers: { 'Idempotency-Key': createRequestId() },
  });
}
