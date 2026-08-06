import { useTranslation } from 'react-i18next';

import { Screen, ScreenHeader } from '@/components';
import { ServiceList } from '@/features/services/components/ServiceList';

/**
 * Services — the catalogue.
 *
 * Only `carpool` is live; the others open the coming-soon modal. The list and
 * its behaviour live in `features/services`; this route only composes them.
 */
export default function ServicesScreen() {
  const { t } = useTranslation();

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('tabs.services')} subtitle="Un compte, plusieurs services" />
      <ServiceList />
    </Screen>
  );
}
