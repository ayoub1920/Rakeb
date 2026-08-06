import { Stack, router } from 'expo-router';

import { AppButton, DevelopmentPlaceholder, Screen } from '@/components';

/** Step 1 — origin, stops, destination. */
export default function PublishRouteScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Itinéraire' }} />

      <DevelopmentPlaceholder
        title="Itinéraire"
        description="Choix du départ, des étapes intermédiaires et de l’arrivée du trajet à publier."
        feature="carpool/publishing"
        endpoints={['GET /places/autocomplete']}
      />

      <AppButton label="Continuer" onPress={() => router.push('/carpool/publish/schedule')} />
    </Screen>
  );
}
