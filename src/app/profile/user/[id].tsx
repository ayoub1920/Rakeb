import { Stack, useLocalSearchParams } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';

/** Public profile of another user — reached from a trip or a conversation. */
export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Profil' }} />

      <DevelopmentPlaceholder
        title="Profil public"
        description="Note, nombre d’avis, ancienneté, badges et préférences de voyage."
        feature="profile"
        endpoints={['GET /users/{id}', 'GET /users/{id}/reviews']}
        params={{ id }}
      />
    </Screen>
  );
}
