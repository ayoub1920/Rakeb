import { Stack, router } from 'expo-router';

import { AppButton, DevelopmentPlaceholder, Screen } from '@/components';

/** Step 4 — seats offered, and the "max two in the back" preference. */
export default function PublishSeatsScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Places' }} />

      <DevelopmentPlaceholder
        title="Places proposées"
        description="Nombre de places, option maximum deux passagers à l’arrière et réservation instantanée."
        feature="carpool/publishing"
      />

      <AppButton label="Continuer" onPress={() => router.push('/carpool/publish/price')} />
    </Screen>
  );
}
