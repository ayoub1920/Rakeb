import { Stack, router } from 'expo-router';

import { AppButton, DevelopmentPlaceholder, Screen } from '@/components';

/**
 * Step 5 — price per seat.
 *
 * The recommended price and its min/max range come from the API. The client
 * renders the slider; it does not compute a suggestion.
 */
export default function PublishPriceScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Prix' }} />

      <DevelopmentPlaceholder
        title="Prix par place"
        description="Curseur ancré sur le prix recommandé par l’API, borné par la fourchette min/max."
        feature="carpool/publishing"
        endpoints={['GET /trips/price-suggestion']}
      />

      <AppButton label="Continuer" onPress={() => router.push('/carpool/publish/review')} />
    </Screen>
  );
}
