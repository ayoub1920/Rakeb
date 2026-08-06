import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useAuth } from '@/auth/use-auth';
import { AppButton, DevelopmentPlaceholder, Screen, ScreenHeader } from '@/components';
import { spacing } from '@/theme';

/**
 * Compte — the hub for profile, payments, wallet and support.
 *
 * Sign-out is wired for real: it is session architecture, not a product screen,
 * and having it here makes the whole auth cycle exercisable end to end.
 */
export default function AccountScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  return (
    <Screen scrollable edges={['top', 'bottom']}>
      <ScreenHeader title={t('tabs.account')} />

      <DevelopmentPlaceholder
        title="Compte"
        description="Profil, vérifications, préférences, moyens de paiement, portefeuille et aide."
        feature="profile"
        endpoints={['GET /me', 'GET /me/stats', 'GET /me/verifications']}
      />

      <View style={{ gap: spacing.sm }}>
        <AppButton
          label="Modifier mon profil"
          variant="secondary"
          onPress={() => router.push('/profile/edit')}
        />
        <AppButton
          label="Mes véhicules"
          variant="secondary"
          onPress={() => router.push('/carpool/vehicles')}
        />
        <AppButton
          label="Aide et sécurité"
          variant="secondary"
          onPress={() => router.push('/support')}
        />
        <AppButton label={t('auth.signOut')} variant="ghost" onPress={() => void signOut()} />
      </View>
    </Screen>
  );
}
