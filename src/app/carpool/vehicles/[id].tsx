import { Stack, useLocalSearchParams } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';

export default function VehicleDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Véhicule' }} />

      <DevelopmentPlaceholder
        title="Détails du véhicule"
        description="Consultation, modification et suppression d’un véhicule enregistré."
        feature="carpool/vehicles"
        endpoints={['PATCH /me/vehicles/{id}', 'DELETE /me/vehicles/{id}']}
        params={{ id }}
      />
    </Screen>
  );
}
