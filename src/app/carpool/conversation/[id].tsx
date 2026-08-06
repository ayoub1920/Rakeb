import { Stack, useLocalSearchParams } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Conversation' }} />

      <DevelopmentPlaceholder
        title="Conversation"
        description="Historique paginé, envoi de messages, réponses rapides, accusés de lecture et indicateur de frappe."
        feature="carpool/conversations"
        endpoints={[
          'GET /conversations/{id}/messages',
          'POST /conversations/{id}/messages',
          'WS /ws/conversations/{id}',
        ]}
        params={{ id }}
      />
    </Screen>
  );
}
