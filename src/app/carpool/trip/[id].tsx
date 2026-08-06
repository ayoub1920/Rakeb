import { Stack, useLocalSearchParams } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';

export default function TripDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Détails du trajet' }} />

      <DevelopmentPlaceholder
        title="Détails du trajet"
        description="Itinéraire, étapes, véhicule, conducteur, places restantes, politique d’annulation et devis."
        feature="carpool/trips"
        endpoints={['GET /trips/{id}', 'GET /trips/{id}/seat-map', 'POST /trips/{id}/quote']}
        params={{ id }}
      />
    </Screen>
  );
}
