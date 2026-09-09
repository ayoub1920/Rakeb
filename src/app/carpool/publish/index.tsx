import { Stack, router } from 'expo-router';
import { useState } from 'react';

import {
  AppButton,
  AppCard,
  AppText,
  ErrorView,
  LoadingView,
  Screen,
} from '@/components';
import { licenceActionLabel, LICENCE_COPY } from '@/features/profile/licence-copy';
import { useCurrentUser, useUpdateRole, useVerifications } from '@/features/profile/queries';
import { isPublishDraftEmpty, usePublishDraftStore } from '@/stores/publish-draft-store';
import { spacing } from '@/theme';

/** Entry point of the publish wizard — the licence gate. */
export default function PublishTripScreen() {
  const reset = usePublishDraftStore((s) => s.reset);
  // A snapshot: whether a partly-filled draft was already in progress when this
  // screen mounted. Resetting on mount (as before) silently wiped a live draft
  // when the wizard was re-opened from Home; instead the user chooses.
  const [hadDraft] = useState(() => !isPublishDraftEmpty(usePublishDraftStore.getState()));
  const { data: verifications, isLoading, isError, error, refetch } = useVerifications();
  const { data: user } = useCurrentUser();
  const updateRole = useUpdateRole();

  function startFresh() {
    reset();
    router.push('/carpool/publish/route');
  }

  if (isLoading) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Publier un trajet' }} />
        <LoadingView />
      </Screen>
    );
  }

  if (isError || !verifications) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Publier un trajet' }} />
        <ErrorView error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  const canPublish = verifications.can_publish;
  const licence = verifications.licence;
  const needsRole = user?.role === 'rider';

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Publier un trajet' }} />

      <AppText variant="title">Proposez votre trajet</AppText>
      <AppText variant="body" color="secondary" style={styles.intro}>
        Publiez un trajet, choisissez vos passagers et partagez les frais de route.
      </AppText>

      {canPublish ? (
        <>
          {needsRole ? (
            <AppCard style={styles.card}>
              <AppText variant="subheading">Activer le mode conducteur</AppText>
              <AppText variant="bodySmall" color="secondary" style={styles.cardBody}>
                Votre compte est en mode passager. Activez le mode conducteur pour publier — vous
                gardez les deux usages.
              </AppText>
              <AppButton
                label="Activer"
                variant="secondary"
                loading={updateRole.isPending}
                onPress={() => updateRole.mutate('both')}
              />
            </AppCard>
          ) : null}

          {hadDraft ? (
            <>
              <AppButton
                label="Reprendre le brouillon"
                onPress={() => router.push('/carpool/publish/route')}
                disabled={needsRole}
                style={styles.cta}
              />
              <AppButton
                label="Recommencer"
                variant="ghost"
                onPress={startFresh}
                disabled={needsRole}
              />
            </>
          ) : (
            <AppButton
              label="Commencer"
              onPress={startFresh}
              disabled={needsRole}
              style={styles.cta}
            />
          )}
        </>
      ) : (
        <AppCard style={styles.card}>
          <AppText variant="subheading">{LICENCE_COPY[licence].title}</AppText>
          <AppText variant="bodySmall" color="secondary" style={styles.cardBody}>
            {LICENCE_COPY[licence].body}
          </AppText>
          {verifications.licence_rejection_reason ? (
            <AppText variant="caption" color="error" style={styles.cardBody}>
              {verifications.licence_rejection_reason}
            </AppText>
          ) : null}
          <AppButton
            label={licenceActionLabel(licence)}
            onPress={() => router.push('/profile/verifications')}
          />
        </AppCard>
      )}
    </Screen>
  );
}

const styles = {
  intro: { marginTop: spacing.sm },
  card: { marginTop: spacing.xl, gap: spacing.sm },
  cardBody: { marginTop: spacing.xs },
  cta: { marginTop: spacing.xl },
} as const;
