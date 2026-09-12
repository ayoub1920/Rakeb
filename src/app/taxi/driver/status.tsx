import { Stack, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppText, ErrorView, LoadingView, Screen } from '@/components';
import { TaxiApplicationStatusBadge } from '@/features/taxi/components/TaxiApplicationStatusBadge';
import { useTaxiApplication } from '@/features/taxi/queries';
import { spacing } from '@/theme';

/**
 * Post-submission state: pending ("en attente de validation"), approved
 * (CTA → go online), or rejected (reason shown + resubmit path).
 */
export default function TaxiDriverStatusScreen() {
  const { data: application, isLoading, isError, error, refetch } = useTaxiApplication();

  if (isLoading) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Ma candidature' }} />
        <LoadingView />
      </Screen>
    );
  }

  if (isError || !application) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Ma candidature' }} />
        <ErrorView error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Ma candidature' }} />
      <AppCard style={styles.card}>
        <TaxiApplicationStatusBadge status={application.status} />
        <AppText variant="title">
          {application.status === 'pending'
            ? 'Candidature envoyée'
            : application.status === 'approved'
              ? 'Candidature approuvée'
              : 'Candidature refusée'}
        </AppText>
        <AppText variant="body" color="secondary">
          {application.status === 'pending'
            ? 'Votre candidature est en attente de validation par notre équipe. Vous serez notifié dès qu’elle sera traitée.'
            : application.status === 'approved'
              ? 'Vous pouvez maintenant passer en ligne pour recevoir des demandes de course.'
              : (application.rejection_reason ??
                'Votre candidature a été refusée. Vous pouvez corriger les informations et renvoyer votre dossier.')}
        </AppText>

        <View style={styles.meta}>
          <AppText variant="caption" color="tertiary">
            Plaque : {application.plate_number}
          </AppText>
          <AppText variant="caption" color="tertiary">
            Envoyée le {new Date(application.submitted_at).toLocaleDateString('fr-FR')}
          </AppText>
        </View>

        {application.status === 'approved' ? (
          <AppButton
            label="Passer en ligne"
            onPress={() => router.push('/taxi/driver/online')}
            style={styles.action}
          />
        ) : application.status === 'rejected' ? (
          <AppButton
            label="Corriger et renvoyer"
            onPress={() => router.push('/taxi/driver/apply')}
            style={styles.action}
          />
        ) : null}
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  meta: {
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
  action: {
    marginTop: spacing.md,
  },
});
