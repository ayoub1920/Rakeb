import { Stack, router } from 'expo-router';

import { AppButton, DevelopmentPlaceholder, Screen } from '@/components';

export default function VehiclesScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Mes véhicules' }} />

      <DevelopmentPlaceholder
        title="Véhicules"
        description="Liste des véhicules enregistrés du conducteur, avec accès à l’ajout et à l’édition."
        feature="carpool/vehicles"
        endpoints={['GET /me/vehicles']}
      />

      <AppButton label="Ajouter un véhicule" onPress={() => router.push('/carpool/vehicles/new')} />
    </Screen>
  );
}
