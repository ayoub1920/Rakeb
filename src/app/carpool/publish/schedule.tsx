import { Stack, router } from 'expo-router';

import { AppButton, DevelopmentPlaceholder, Screen } from '@/components';

/** Step 2 — departure date and time, optional recurrence. */
export default function PublishScheduleScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Date et heure' }} />

      <DevelopmentPlaceholder
        title="Date et heure"
        description="Date, heure de départ et récurrence éventuelle pour un trajet régulier."
        feature="carpool/publishing"
      />

      <AppButton label="Continuer" onPress={() => router.push('/carpool/publish/vehicle')} />
    </Screen>
  );
}
