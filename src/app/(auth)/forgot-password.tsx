import { DevelopmentPlaceholder, Screen, ScreenHeader } from '@/components';

export default function ForgotPasswordScreen() {
  return (
    <Screen scrollable>
      <ScreenHeader title="Mot de passe oublié" showBack />

      <DevelopmentPlaceholder
        title="Réinitialisation"
        description="Envoie un lien de réinitialisation par email puis confirme le nouveau mot de passe."
        feature="auth"
        endpoints={['POST /auth/password/forgot', 'POST /auth/password/reset']}
      />
    </Screen>
  );
}
