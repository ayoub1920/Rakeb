import { router } from 'expo-router';

import { AppButton, DevelopmentPlaceholder, Screen, ScreenHeader } from '@/components';

export default function LoginScreen() {
  return (
    <Screen scrollable>
      <ScreenHeader title="Connexion" subtitle="Email et mot de passe" showBack />

      <DevelopmentPlaceholder
        title="Connexion par email"
        description="Voie secondaire pour les comptes déjà inscrits, en complément de la connexion par SMS."
        feature="auth"
        endpoints={['POST /auth/login']}
      />

      <AppButton
        label="Mot de passe oublié"
        variant="ghost"
        onPress={() => router.push('/(auth)/forgot-password')}
      />
    </Screen>
  );
}
