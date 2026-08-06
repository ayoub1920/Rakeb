import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppButton, AppText, Screen } from '@/components';
import { spacing } from '@/theme';

/**
 * Shown when a `coming_soon` service is tapped.
 *
 * The service name arrives as a route param rather than being looked up again:
 * the catalogue already has it, and the modal should not depend on the
 * services feature to render.
 */
export default function ComingSoonModal() {
  const { t } = useTranslation();
  const { serviceName } = useLocalSearchParams<{ serviceName?: string }>();

  return (
    <Screen>
      <Stack.Screen options={{ title: serviceName ?? t('services.comingSoonTitle') }} />

      <AppText variant="heading" style={{ marginTop: spacing.xl }}>
        {t('services.comingSoonTitle')}
      </AppText>
      <AppText variant="body" color="secondary" style={{ marginTop: spacing.sm }}>
        {t('services.comingSoonBody')}
      </AppText>

      <AppButton
        label={t('common.close')}
        onPress={() => router.back()}
        style={{ marginTop: spacing.xl }}
      />
    </Screen>
  );
}
