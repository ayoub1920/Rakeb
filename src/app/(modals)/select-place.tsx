import { Stack, useLocalSearchParams } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';

/**
 * Place picker.
 *
 * A modal because it is opened from two different flows — passenger search and
 * the driver publish wizard — and must return to whichever one opened it.
 * `field` says which slot the chosen place fills.
 */
export default function SelectPlaceModal() {
  const { field } = useLocalSearchParams<{ field?: 'origin' | 'destination' | 'stop' }>();

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Choisir un lieu' }} />

      <DevelopmentPlaceholder
        title="Sélection d’un lieu"
        description="Recherche par autocomplétion des villes et points de rendez-vous tunisiens."
        feature="carpool/places"
        endpoints={['GET /places/autocomplete', 'GET /places/{id}']}
        params={{ field }}
      />
    </Screen>
  );
}
