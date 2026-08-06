import { Stack, router } from 'expo-router';

import { AppButton, DevelopmentPlaceholder, Screen } from '@/components';

/**
 * Passenger search form.
 *
 * The criteria belong to `stores/carpool-search-store`, so the results screen
 * and "search again" from the home screen read the same values.
 */
export default function SearchScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Rechercher un trajet' }} />

      <DevelopmentPlaceholder
        title="Recherche"
        description="Choix du départ, de l’arrivée, de la date et du nombre de places avant de lancer la recherche."
        feature="carpool/search"
        endpoints={['GET /places/autocomplete', 'GET /me/recent-searches']}
      />

      <AppButton label="Voir les trajets" onPress={() => router.push('/carpool/results')} />
    </Screen>
  );
}
