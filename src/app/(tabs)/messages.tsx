import { useTranslation } from 'react-i18next';

import { DevelopmentPlaceholder, Screen, ScreenHeader } from '@/components';

/** Messages — the conversation list. A conversation is created with a booking. */
export default function MessagesScreen() {
  const { t } = useTranslation();

  return (
    <Screen scrollable edges={['top', 'bottom']}>
      <ScreenHeader title={t('tabs.messages')} subtitle="Vos échanges avec les conducteurs" />

      <DevelopmentPlaceholder
        title="Messages"
        description="Liste des conversations avec dernier message et compteur de non-lus."
        feature="carpool/conversations"
        endpoints={['GET /conversations', 'WS /ws/conversations/{id}']}
      />
    </Screen>
  );
}
