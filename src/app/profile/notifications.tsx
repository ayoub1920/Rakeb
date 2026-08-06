import { Stack } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';

export default function NotificationSettingsScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Notifications' }} />

      <DevelopmentPlaceholder
        title="Paramètres de notification"
        description="Réservation acceptée, nouveau message et rappel de départ, plus la demande d’autorisation système."
        feature="notifications"
        endpoints={['GET /me/notification-settings', 'PUT /me/notification-settings']}
      />
    </Screen>
  );
}
