import { Stack, router } from 'expo-router';

import { AppButton, AppText, Screen } from '@/components';

export default function NotFoundScreen() {
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Page introuvable' }} />
      <AppText variant="heading">Cette page n’existe pas</AppText>
      <AppText variant="bodySmall" color="secondary">
        Le lien que vous avez suivi ne correspond à aucun écran de l’application.
      </AppText>
      <AppButton label="Retour à l’accueil" onPress={() => router.replace('/(tabs)')} />
    </Screen>
  );
}
