import { flattenPages } from '@/api/pagination';
import { apiPost } from '@/api/request';
import { publishTrip, type PublishDraft } from '@/features/carpool/publishing/api';
import { devBecomeAdmin, getVerifications, submitLicence } from '@/features/profile/api';
import type { PickedFile } from '@/features/uploads/api';
import type { CursorPage } from '@/types/api';
import type { LicenceVerification, Place } from '@/types/models';

import {
  approveLicenceVerification,
  getLicenceVerification,
  getLicenceVerifications,
  rejectLicenceVerification,
} from './api';

/**
 * End-to-end walk of the driver's-licence-verification workflow against the
 * mock API (`src/api/mock/routes.ts`), covering the scenarios listed in
 * "Phase 11 — testing" of the driver-licence-verification handover:
 *
 *   publish blocked → submit (sign → PUT → confirm → submit) → pending →
 *   admin sees it → approve → publish allowed → reject path → resubmit →
 *   still one record.
 *
 * These call the feature `api.ts` functions directly rather than through
 * hooks — the mock adapter doesn't care about auth headers or React Query, and
 * a straight-line async test reads closer to the numbered scenarios than a
 * `renderHook` per step would.
 */

const ORIGIN: Place = { id: 'plc_a', label: 'Tunis', governorate: 'Tunis', lat: 36.8, lng: 10.18 };
const DESTINATION: Place = { id: 'plc_b', label: 'Sousse', governorate: 'Sousse', lat: 35.82, lng: 10.6 };

const DRAFT: PublishDraft = {
  vehicleId: 'veh_test',
  origin: ORIGIN,
  destination: DESTINATION,
  stops: [],
  departureDate: '2026-09-10',
  departureTime: '08:00',
  seats: 3,
  pricePerSeat: 15_000,
  instantBook: true,
  maxTwoInBack: false,
  notes: '',
  recurrence: null,
};

/** A tiny, fetchable "picked file" — `expo-image-picker` gives a `file://` uri on-device; a `data:` one is what Node's `fetch` can actually read in a test. */
function fakeDocument(seed: string): PickedFile {
  const base64 = Buffer.from(seed).toString('base64');
  return { uri: `data:image/jpeg;base64,${base64}`, mimeType: 'image/jpeg', fileName: `${seed}.jpg` };
}

async function firstPending(): Promise<LicenceVerification> {
  const page: CursorPage<LicenceVerification> = await getLicenceVerifications('pending', null);
  const [row] = flattenPages({ pages: [page], pageParams: [null] });
  if (!row) throw new Error('expected a pending row');
  return row;
}

async function expectForbidden(promise: Promise<unknown>) {
  await expect(promise).rejects.toMatchObject({ status: 403 });
}

describe('driver licence verification', () => {
  it('gates publishing until an admin approves the submitted licence', async () => {
    // 1–2. A driver with no licence on file cannot publish.
    let verifications = await getVerifications();
    expect(verifications.licence).toBe('none');
    expect(verifications.can_publish).toBe(false);
    await expectForbidden(publishTrip(DRAFT));

    // Security: a non-admin hitting the admin API directly is rejected server
    // side — not merely kept off the screen by the frontend route guard.
    await expectForbidden(getLicenceVerifications(undefined, null));

    // 3–5. Submitting (sign → PUT → confirm → submit) moves the gate to
    // `pending`; still blocked.
    verifications = await submitLicence(fakeDocument('permis-1'));
    expect(verifications.licence).toBe('pending');
    expect(verifications.can_publish).toBe(false);
    await expectForbidden(publishTrip(DRAFT));

    // 6. The admin now sees exactly this submission in the queue.
    await devBecomeAdmin();
    const submission = await firstPending();
    expect(submission.front_document_url).toBeTruthy();

    const detail = await getLicenceVerification(submission.user.id);
    expect(detail.status).toBe('pending');

    // 7–9. Approve → the driver can publish, and the trip is created.
    await approveLicenceVerification(submission.user.id);
    verifications = await getVerifications();
    expect(verifications.licence).toBe('approved');
    expect(verifications.can_publish).toBe(true);

    const trip = await publishTrip(DRAFT);
    expect(trip.origin.label).toBe('Tunis');
    expect(trip.destination.label).toBe('Sousse');

    // 10. Publishing again afterwards needs no resubmission.
    await expect(publishTrip(DRAFT)).resolves.toBeDefined();

    // 11–12. A second submission is pending again; resubmitting updates the
    // same record rather than queuing a second one.
    await submitLicence(fakeDocument('permis-2'));
    const secondPending = await getLicenceVerifications('pending', null);
    expect(secondPending.items).toHaveLength(1);
    expect(secondPending.items[0]!.user.id).toBe(submission.user.id);

    await rejectLicenceVerification(submission.user.id, 'Photo illisible.');
    const rejected = await getLicenceVerification(submission.user.id);
    expect(rejected.status).toBe('rejected');
    expect(rejected.rejection_reason).toBe('Photo illisible.');

    verifications = await getVerifications();
    expect(verifications.licence).toBe('rejected');
    expect(verifications.licence_rejection_reason).toBe('Photo illisible.');
    expect(verifications.can_publish).toBe(false);
    await expectForbidden(publishTrip(DRAFT));

    // Resubmitting after a rejection is allowed and reuses the same record —
    // never a second row for the same driver.
    await submitLicence(fakeDocument('permis-3'));
    const afterResubmit = await getLicenceVerifications('pending', null);
    expect(afterResubmit.items).toHaveLength(1);
    expect(afterResubmit.items[0]!.status).toBe('pending');
  });

  it('refuses to submit a licence with an unconfirmed upload', async () => {
    // Mirrors the real backend's `assertUploads` check — a `front_upload_id`
    // that was signed but never actually uploaded/confirmed must not let a
    // verification through. Calls `/uploads/sign` and `/me/verifications/licence`
    // directly (skipping `uploadFile`'s PUT + confirm) to exercise exactly that gap.
    const signed = await apiPost<{ upload_id: string }>('/uploads/sign', {
      purpose: 'licence_front',
      mime_type: 'image/jpeg',
      size_bytes: 10,
    });

    await expect(
      apiPost('/me/verifications/licence', { front_upload_id: signed.upload_id }),
    ).rejects.toMatchObject({ status: 400, code: 'UPLOAD_NOT_CONFIRMED' });
  });
});
