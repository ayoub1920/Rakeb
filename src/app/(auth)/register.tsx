import { DevelopmentPlaceholder, Screen, ScreenHeader } from '@/components';

/** Reached when `POST /auth/phone/verify` returns `is_new_user: true`. */
export default function RegisterScreen() {
  return (
    <Screen scrollable>
      <ScreenHeader title="Créer votre compte" showBack />

      <DevelopmentPlaceholder
        title="Fin d’inscription"
        description="Complète le profil après vérification du téléphone : email, mot de passe, consentement marketing."
        feature="auth"
        endpoints={['POST /auth/register', 'POST /referrals/claim']}
      />
    </Screen>
  );
}
