import { router } from 'expo-router';

import { AppButton, DevelopmentPlaceholder, Screen, ScreenHeader } from '@/components';

export default function PhoneScreen() {
  return (
    <Screen scrollable>
      <ScreenHeader title="Numéro de téléphone" showBack />

      <DevelopmentPlaceholder
        title="Saisie du numéro"
        description="Valide le format tunisien puis demande l’envoi du code de vérification."
        feature="auth"
        endpoints={['POST /auth/phone/start']}
      />

      <AppButton label="Recevoir le code" onPress={() => router.push('/(auth)/otp')} />
    </Screen>
  );
}
