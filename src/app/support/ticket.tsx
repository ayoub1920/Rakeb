import { Stack } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';

export default function SupportTicketScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Contacter le support' }} />

      <DevelopmentPlaceholder
        title="Ticket de support"
        description="Formulaire de contact ; doit joindre le requestId de l’erreur quand il est ouvert depuis un écran en échec."
        feature="support"
        endpoints={['POST /support/tickets']}
      />
    </Screen>
  );
}
