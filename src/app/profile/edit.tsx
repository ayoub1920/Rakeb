import { Stack } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';

export default function EditProfileScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Modifier mon profil' }} />

      <DevelopmentPlaceholder
        title="Profil"
        description="Prénom, nom, date de naissance, email, photo et rôle actif."
        feature="profile"
        endpoints={['PATCH /me', 'POST /me/avatar', 'PATCH /me/role']}
      />
    </Screen>
  );
}
