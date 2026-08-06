import { Stack, router } from 'expo-router';

import { AppButton, DevelopmentPlaceholder, Screen } from '@/components';

/** Step 3 — pick the vehicle for this trip. */
export default function PublishVehicleScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Véhicule' }} />

      <DevelopmentPlaceholder
        title="Véhicule"
        description="Sélection d’un véhicule enregistré, ou ajout d’un nouveau véhicule sans quitter le parcours."
        feature="carpool/vehicles"
        endpoints={['GET /me/vehicles', 'POST /me/vehicles']}
      />

      <AppButton label="Continuer" onPress={() => router.push('/carpool/publish/seats')} />
    </Screen>
  );
}
