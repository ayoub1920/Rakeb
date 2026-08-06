import { Stack } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';

/** Step 6 — recap and publish. The only step that sends `POST /trips`. */
export default function PublishReviewScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Vérifier et publier' }} />

      <DevelopmentPlaceholder
        title="Vérification"
        description="Récapitulatif du brouillon complet avant publication, puis remise à zéro du brouillon."
        feature="carpool/publishing"
        endpoints={['POST /trips']}
      />
    </Screen>
  );
}
