import { Stack, useLocalSearchParams } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';

export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Réservation' }} />

      <DevelopmentPlaceholder
        title="Détails de la réservation"
        description="Billet avec code de réservation et code passager à 4 chiffres, partage du suivi et annulation."
        feature="carpool/bookings"
        endpoints={[
          'GET /bookings/{id}',
          'POST /bookings/{id}/cancel',
          'POST /bookings/{id}/share',
        ]}
        params={{ id }}
      />
    </Screen>
  );
}
