import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { normalizeError } from '@/api/errors';
import { AppButton, AppInput, AppText, Screen } from '@/components';
import { useCreateReport, type ReportTargetType } from '@/features/support/queries';
import { spacing } from '@/theme';

const REASONS = [
  'inappropriate_behaviour',
  'unsafe_driving',
  'no_show',
  'harassment',
  'scam',
  'other',
] as const;

const REASON_LABEL: Record<string, string> = {
  inappropriate_behaviour: 'Comportement déplacé',
  unsafe_driving: 'Conduite dangereuse',
  no_show: 'Ne s’est pas présenté',
  harassment: 'Harcèlement',
  scam: 'Arnaque',
  other: 'Autre',
};

/** Report a user, trip, booking or message. Reached with `target_type` and `target_id`. */
export default function ReportScreen() {
  const { target_type: targetType, target_id: targetId } = useLocalSearchParams<{
    target_type?: string;
    target_id?: string;
  }>();
  const create = useCreateReport();

  const [reason, setReason] = useState<string>('inappropriate_behaviour');
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const validTarget =
    (targetType === 'user' ||
      targetType === 'trip' ||
      targetType === 'booking' ||
      targetType === 'message') &&
    !!targetId;

  async function onSubmit() {
    setError(null);
    if (!validTarget) {
      setError('Cible du signalement manquante.');
      return;
    }
    try {
      await create.mutateAsync({
        target_type: targetType as ReportTargetType,
        target_id: targetId as string,
        reason,
        details: details.trim() || undefined,
      });
      setDone(true);
    } catch (e) {
      setError(normalizeError(e).message);
    }
  }

  if (done) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Signaler' }} />
        <View style={styles.sections}>
          <AppText variant="title">Signalement envoyé</AppText>
          <AppText variant="body" color="secondary">
            Merci. Notre équipe sécurité examine chaque signalement.
          </AppText>
          <AppButton label="Retour" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Signaler' }} />
      <View style={styles.sections}>
        <AppText variant="body" color="secondary">
          Décrivez le problème. Un signalement est confidentiel.
        </AppText>

        <View style={styles.block}>
          <AppText variant="label" color="secondary">
            Motif
          </AppText>
          <View style={styles.chips}>
            {REASONS.map((r) => (
              <AppButton
                key={r}
                label={REASON_LABEL[r]}
                variant={reason === r ? 'primary' : 'secondary'}
                fullWidth={false}
                onPress={() => setReason(r)}
              />
            ))}
          </View>
        </View>

        <AppInput
          label="Détails (optionnel)"
          value={details}
          onChangeText={setDetails}
          multiline
          numberOfLines={5}
          maxLength={2000}
        />

        {error ? (
          <AppText variant="bodySmall" color="error">
            {error}
          </AppText>
        ) : null}

        <AppButton
          label="Envoyer le signalement"
          variant="danger"
          loading={create.isPending}
          onPress={() => void onSubmit()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing.lg, paddingTop: spacing.md },
  block: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
