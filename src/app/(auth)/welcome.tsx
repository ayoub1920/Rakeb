import { router } from 'expo-router';
import { View } from 'react-native';

import { AppButton, DevelopmentPlaceholder, Screen, ScreenHeader } from '@/components';
import { spacing } from '@/theme';

/** Entry point of the auth flow, and the redirect target for signed-out users. */
export default function WelcomeScreen() {
  return (
    <Screen scrollable>
      <ScreenHeader title="Bienvenue sur Rakeb" subtitle="Covoiturage entre villes tunisiennes" />

      <DevelopmentPlaceholder
        title="Accueil de connexion"
        description="Présente Rakeb et oriente vers la connexion par téléphone ou par email."
        feature="auth"
      />

      <View style={{ gap: spacing.md }}>
        <AppButton label="Continuer avec mon numéro" onPress={() => router.push('/(auth)/phone')} />
        <AppButton
          label="J’ai déjà un compte"
          variant="secondary"
          onPress={() => router.push('/(auth)/login')}
        />
      </View>
    </Screen>
  );
}
