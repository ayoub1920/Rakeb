import { Stack } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';

export default function NewVehicleScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Ajouter un véhicule' }} />

      <DevelopmentPlaceholder
        title="Nouveau véhicule"
        description="Modèle, couleur, plaque au format 204 TU 3456 et nombre de places."
        feature="carpool/vehicles"
        endpoints={['POST /me/vehicles']}
      />
    </Screen>
  );
}
