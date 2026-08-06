import { Stack } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';

export default function PreferencesScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Préférences de voyage' }} />

      <DevelopmentPlaceholder
        title="Préférences"
        description="Discussion, musique, cigarette et animaux : affichées sur le profil public."
        feature="profile"
        endpoints={['GET /me/preferences', 'PUT /me/preferences']}
      />
    </Screen>
  );
}
