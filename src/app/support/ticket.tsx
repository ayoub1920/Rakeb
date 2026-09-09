import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { normalizeError } from '@/api/errors';
import { AppButton, AppCard, AppInput, AppText, Screen } from '@/components';
import { useCreateTicket } from '@/features/support/queries';
import { spacing } from '@/theme';

const CATEGORIES = [
  { value: 'account', label: 'Compte' },
  { value: 'payments', label: 'Paiements' },
  { value: 'trips', label: 'Trajets' },
  { value: 'safety', label: 'Sécurité' },
  { value: 'other', label: 'Autre' },
] as const;

/** Contact the support team. Carries the failing request id when opened from an error screen. */
export default function SupportTicketScreen() {
  const { request_id: requestId } = useLocalSearchParams<{ request_id?: string }>();
  const create = useCreateTicket();

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [message, setMessage] = useState(requestId ? `Référence technique : ${requestId}\n\n` : '');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    if (subject.trim().length < 3 || message.trim().length < 10) {
      setError('Ajoutez un objet et un message d’au moins 10 caractères.');
      return;
    }
    try {
      const ticket = await create.mutateAsync({
        subject: subject.trim(),
        category,
        message: message.trim(),
      });
      setDone(ticket.reference);
    } catch (e) {
      setError(normalizeError(e).message);
    }
  }

  if (done) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Contacter le support' }} />
        <View style={styles.sections}>
          <AppText variant="title">Message envoyé</AppText>
          <AppText variant="body" color="secondary">
            Votre demande porte la référence {done}. Notre équipe vous répond par email.
          </AppText>
          <AppButton label="Retour" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Contacter le support' }} />
      <View style={styles.sections}>
        <AppInput label="Objet" value={subject} onChangeText={setSubject} maxLength={160} />

        <View style={styles.block}>
          <AppText variant="label" color="secondary">
            Catégorie
          </AppText>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => (
              <AppButton
                key={c.value}
                label={c.label}
                variant={category === c.value ? 'primary' : 'secondary'}
                fullWidth={false}
                onPress={() => setCategory(c.value)}
              />
            ))}
          </View>
        </View>

        <AppInput
          label="Message"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          maxLength={4000}
        />

        {error ? (
          <AppText variant="bodySmall" color="error">
            {error}
          </AppText>
        ) : null}

        <AppButton label="Envoyer" loading={create.isPending} onPress={() => void onSubmit()} />

        <AppCard>
          <AppText variant="caption" color="tertiary">
            Urgence pendant un trajet ? Utilisez le bouton SOS de l’écran de suivi.
          </AppText>
        </AppCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing.lg, paddingTop: spacing.md },
  block: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
