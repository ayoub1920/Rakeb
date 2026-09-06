import type { VerificationStatus } from '@/types/models';

/**
 * User-facing copy for each licence status.
 *
 * Shared by the publish wizard's gate (`app/carpool/publish/index.tsx`) and the
 * verifications screen (`app/profile/verifications.tsx`) so the two never drift
 * apart. `approved` has no card — both screens treat it as "nothing to show".
 */
export const LICENCE_COPY: Record<VerificationStatus, { title: string; body: string }> = {
  none: {
    title: 'Vérifiez votre permis',
    body: 'Les conducteurs sont vérifiés (permis) avant de pouvoir publier un trajet. Comptez 2 minutes.',
  },
  pending: {
    title: 'Permis en cours de vérification',
    body: 'Nous examinons votre permis. Vous pourrez publier dès qu’il est validé — en général sous 24 h.',
  },
  rejected: {
    title: 'Permis refusé',
    body: 'Votre dernière soumission n’a pas été acceptée. Renvoyez une photo lisible du permis.',
  },
  approved: { title: '', body: '' },
};

/** Button label for the licence card, shared by the same two screens. */
export function licenceActionLabel(status: VerificationStatus): string {
  if (status === 'pending') return 'Voir le statut';
  if (status === 'rejected') return 'Renvoyer mon permis';
  return 'Envoyer mon permis';
}
