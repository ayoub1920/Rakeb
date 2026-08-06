import { useLocalSearchParams } from 'expo-router';

import { DevelopmentPlaceholder, Screen, ScreenHeader } from '@/components';

/**
 * `otp_token` is carried as a route param rather than in a store: it is
 * single-use, short-lived, and meaningless once this screen is left.
 */
export default function OtpScreen() {
  const { otp_token: otpToken, phone } = useLocalSearchParams<{
    otp_token?: string;
    phone?: string;
  }>();

  return (
    <Screen scrollable>
      <ScreenHeader title="Code de vérification" subtitle={phone} showBack />

      <DevelopmentPlaceholder
        title="Vérification du code"
        description="Saisie du code à 6 chiffres, renvoi limité, puis ouverture de la session."
        feature="auth"
        endpoints={['POST /auth/phone/verify', 'POST /auth/phone/resend']}
        params={{ otp_token: otpToken, phone }}
      />
    </Screen>
  );
}
