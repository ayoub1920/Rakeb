import {
  addCard,
  addMobileMoney,
  deletePaymentMethod,
  getPaymentMethods,
  updatePaymentMethod,
} from '@/features/payments/api';

import { getPreferences, setPreferences, updateProfile } from './api';

/**
 * The account screens' data layer against the mock API (`src/api/mock`),
 * which mirrors `rakeb-backend`'s `UsersController` and
 * `PaymentMethodsController`:
 *
 *  - `/profile/edit`          → `PATCH /me`
 *  - `/profile/preferences`   → `GET · PUT /me/preferences`
 *  - `/profile/payment-methods` → `GET · POST · PATCH · DELETE /payment-methods`
 */

describe('profile edit', () => {
  it('patches the profile and echoes it back', async () => {
    const updated = await updateProfile({ first_name: 'Sami', bio: 'Non-fumeur.' });
    expect(updated.first_name).toBe('Sami');
    expect(updated.bio).toBe('Non-fumeur.');
  });
});

describe('travel preferences', () => {
  it('reads and replaces all four', async () => {
    const before = await getPreferences();
    expect(['yes', 'no', 'maybe']).toContain(before.chat);

    const saved = await setPreferences({ chat: 'no', music: 'yes', smoking: 'no', pets: 'maybe' });
    expect(saved).toEqual({ chat: 'no', music: 'yes', smoking: 'no', pets: 'maybe' });

    const reread = await getPreferences();
    expect(reread.music).toBe('yes');
  });
});

describe('payment methods', () => {
  it('adds a card and a mobile-money account, renames, sets default, deletes', async () => {
    const card = await addCard({ provider_token: 'tok_visa_4242', label: 'Perso' });
    expect(card.kind).toBe('card');
    expect(card.builtin).toBe(false);

    const mobile = await addMobileMoney({ provider: 'd17', msisdn: '+21698123456' });
    expect(mobile.kind).toBe('mobile_money');

    const renamed = await updatePaymentMethod(card.id, { label: 'Pro' });
    expect(renamed.label).toBe('Pro');

    const promoted = await updatePaymentMethod(mobile.id, { is_default: true });
    expect(promoted.is_default).toBe(true);

    await deletePaymentMethod(card.id);
    const remaining = await getPaymentMethods();
    expect(remaining.find((m) => m.id === card.id)).toBeUndefined();
    // Cash + wallet are always present and cannot be removed.
    expect(remaining.some((m) => m.kind === 'cash')).toBe(true);
    expect(remaining.some((m) => m.kind === 'wallet')).toBe(true);
  });
});
