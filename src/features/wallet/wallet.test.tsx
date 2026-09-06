import { flattenPages } from '@/api/pagination';
import type { CursorPage } from '@/types/api';
import type { WalletTransaction } from '@/types/models';

import {
  getWalletBalance,
  getWalletTransactions,
  topupWallet,
  withdrawFromWallet,
} from './api';

/**
 * The wallet against the mock API (`src/api/mock/routes.ts`, mirroring
 * `rakeb-backend`'s `WalletController` + `WalletFundingController`): balance,
 * ledger, top-up and withdraw, and the insufficient-funds guard.
 */

async function ledger(): Promise<WalletTransaction[]> {
  const page: CursorPage<WalletTransaction> = await getWalletTransactions(null);
  return flattenPages({ pages: [page], pageParams: [null] });
}

describe('wallet', () => {
  it('reads the balance and the ledger', async () => {
    const balance = await getWalletBalance();
    expect(balance.total).toBe(balance.available + balance.pending);
    expect(balance.currency).toBe('TND');

    const rows = await ledger();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => typeof r.amount === 'number')).toBe(true);
  });

  it('tops up and the balance + ledger reflect it', async () => {
    const before = await getWalletBalance();
    await topupWallet(20_000, 'pm_card');
    const after = await getWalletBalance();
    expect(after.available).toBe(before.available + 20_000);

    const rows = await ledger();
    expect(rows[0]!.type).toBe('topup');
    expect(rows[0]!.amount).toBe(20_000);
  });

  it('withdraws when funds are sufficient and refuses when not', async () => {
    await topupWallet(50_000, 'pm_card');
    const withdrawal = await withdrawFromWallet({
      amount: 10_000,
      destination_type: 'rib',
      rib: 'TN5910006035183598478831',
    });
    expect(withdrawal.amount).toBe(10_000);

    const balance = await getWalletBalance();
    await expect(
      withdrawFromWallet({
        amount: balance.available + 1_000_000,
        destination_type: 'rib',
        rib: 'TN5910006035183598478831',
      }),
    ).rejects.toMatchObject({ status: 400, code: 'WALLET_INSUFFICIENT_FUNDS' });
  });
});
