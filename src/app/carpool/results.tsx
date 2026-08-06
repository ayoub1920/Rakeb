import { Stack } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';

/** Search results — the canonical infinite list. */
export default function ResultsScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Trajets disponibles' }} />

      <DevelopmentPlaceholder
        title="Résultats"
        description="Liste paginée des trajets correspondant à la recherche, avec tri, filtres et bascule carte."
        feature="carpool/search"
        endpoints={['GET /trips/search', 'GET /trips/search/map']}
      />
    </Screen>
  );
}
