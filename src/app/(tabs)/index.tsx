import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppButton, DevelopmentPlaceholder, Screen, ScreenHeader } from '@/components';

/** Accueil — the app's landing screen. */
export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <Screen scrollable edges={['top', 'bottom']}>
      <ScreenHeader title={t('tabs.home')} subtitle="Où allez-vous aujourd’hui ?" />

      <DevelopmentPlaceholder
        title="Accueil"
        description="Recherche rapide, trajets proches de vous, bannières promo et raccourcis vers les services."
        feature="carpool/search"
        endpoints={['GET /trips/nearby', 'GET /promos/banners', 'GET /services']}
      />

      <AppButton label={t('common.search')} onPress={() => router.push('/carpool/search')} />
    </Screen>
  );
}
