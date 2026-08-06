import { Stack, useLocalSearchParams } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';

export default function ReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Laisser un avis' }} />

      <DevelopmentPlaceholder
        title="Avis"
        description="Note de 1 à 5, tags de compliment, commentaire libre et pourboire optionnel."
        feature="carpool/reviews"
        endpoints={['GET /reviews/tags', 'POST /bookings/{id}/review', 'POST /bookings/{id}/tip']}
        params={{ bookingId }}
      />
    </Screen>
  );
}
