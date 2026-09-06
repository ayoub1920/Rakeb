import { flattenPages } from '@/api/pagination';
import { devBecomeAdmin } from '@/features/profile/api';
import type { CursorPage } from '@/types/api';
import type { AdminUserSummary } from '@/types/models';

import { getUserDetail, searchUsers, setUserRole, setUserStatus } from './api';

/**
 * The admin user directory against the mock API (`src/api/mock/routes.ts`,
 * which mirrors `rakeb-backend`'s `admin-users.controller.ts`): search +
 * filter, detail, suspend / reactivate, role change, and the "can't act on
 * your own account" guard.
 */

async function allUsers(search: Parameters<typeof searchUsers>[0] = {}): Promise<AdminUserSummary[]> {
  const page: CursorPage<AdminUserSummary> = await searchUsers(search, null);
  return flattenPages({ pages: [page], pageParams: [null] });
}

describe('admin user directory', () => {
  it('requires staff for every endpoint', async () => {
    await expect(searchUsers({}, null)).rejects.toMatchObject({ status: 403 });
  });

  it('searches, filters, and reads a user detail', async () => {
    await devBecomeAdmin();

    const everyone = await allUsers();
    expect(everyone.length).toBeGreaterThan(1);

    const drivers = await allUsers({ role: 'driver' });
    expect(drivers.every((u) => u.role === 'driver')).toBe(true);

    const suspended = await allUsers({ status: 'suspended' });
    expect(suspended.every((u) => u.status === 'suspended')).toBe(true);

    const byName = await allUsers({ q: 'sarra' });
    expect(byName).toHaveLength(1);
    expect(byName[0]!.display_name).toMatch(/Sarra/i);

    const detail = await getUserDetail(byName[0]!.id);
    expect(detail.verifications.licence).toBe('approved');
    expect(typeof detail.trips_as_driver).toBe('number');
  });

  it('suspends, reactivates, and changes a role', async () => {
    await devBecomeAdmin();
    const [target] = await allUsers({ q: 'sarra' });

    const suspended = await setUserStatus(target!.id, 'suspended', 'Test');
    expect(suspended.status).toBe('suspended');

    const reactivated = await setUserStatus(target!.id, 'active', undefined);
    expect(reactivated.status).toBe('active');

    const promoted = await setUserRole(target!.id, 'support');
    expect(promoted.role).toBe('support');
  });

  it('refuses to change your own account', async () => {
    await devBecomeAdmin();
    const [me] = await allUsers({ q: '+21698123456' }); // mockCurrentUser's phone

    await expect(setUserStatus(me!.id, 'suspended', undefined)).rejects.toMatchObject({
      status: 400,
    });
    await expect(setUserRole(me!.id, 'rider')).rejects.toMatchObject({ status: 400 });
  });
});
