import { Stack } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';

export default function WalletScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Portefeuille' }} />

      <DevelopmentPlaceholder
        title="Portefeuille"
        description="Solde disponible et en attente, recharge, retrait et historique des opérations."
        feature="wallet"
        endpoints={['GET /wallet', 'POST /wallet/topup', 'GET /wallet/transactions']}
      />
    </Screen>
  );
}
