import { useTranslation } from 'react-i18next';

import { DevelopmentPlaceholder, Screen, ScreenHeader } from '@/components';

/** Activité — the passenger's bookings, split into upcoming / past / cancelled. */
export default function ActivityScreen() {
  const { t } = useTranslation();

  return (
    <Screen scrollable edges={['top', 'bottom']}>
      <ScreenHeader title={t('tabs.activity')} subtitle="Vos réservations et vos trajets" />

      <DevelopmentPlaceholder
        title="Activité"
        description="Liste paginée des réservations par onglet, et accès au billet de chaque trajet."
        feature="carpool/bookings"
        endpoints={['GET /bookings?status=upcoming|past|cancelled', 'GET /me/trips']}
      />
    </Screen>
  );
}
