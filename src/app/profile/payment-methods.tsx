import { Stack } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';

export default function PaymentMethodsScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Moyens de paiement' }} />

      <DevelopmentPlaceholder
        title="Moyens de paiement"
        description="Cartes via token PSP, mobile money D17 / e-DINAR / Flouci, espèces et portefeuille."
        feature="payments"
        endpoints={[
          'GET /payment-methods',
          'POST /payment-methods',
          'POST /payment-methods/mobile',
        ]}
      />
    </Screen>
  );
}
