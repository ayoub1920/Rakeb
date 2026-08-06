import { Stack, router } from 'expo-router';

import { AppButton, DevelopmentPlaceholder, Screen } from '@/components';

/** Entry point of the publish wizard. */
export default function PublishTripScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Publier un trajet' }} />

      <DevelopmentPlaceholder
        title="Publier un trajet"
        description="Point de départ du parcours conducteur ; vérifie le permis avant d’ouvrir les étapes."
        feature="carpool/publishing"
        endpoints={['GET /me/verifications', 'POST /trips']}
      />

      <AppButton label="Commencer" onPress={() => router.push('/carpool/publish/route')} />
    </Screen>
  );
}
