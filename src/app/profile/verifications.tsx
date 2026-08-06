import { Stack } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';

/** Licence verification gates trip publication, so this screen blocks a flow. */
export default function VerificationsScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Vérifications' }} />

      <DevelopmentPlaceholder
        title="Vérifications"
        description="Statuts téléphone, email, CIN et permis, avec envoi des pièces justificatives."
        feature="profile"
        endpoints={[
          'GET /me/verifications',
          'POST /me/verifications/cin',
          'POST /me/verifications/licence',
        ]}
      />
    </Screen>
  );
}
