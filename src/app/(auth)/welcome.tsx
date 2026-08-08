import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppText, Screen } from '@/components';
import { colors, radius, spacing } from '@/theme';

/** Entry point of the auth flow, and the redirect target for signed-out users. */
export default function WelcomeScreen() {
  return (
    <Screen scrollable>
      <View style={styles.hero}>
        <AppText variant="caption" color="tertiary">
          Photo : deux personnes en voiture, route côtière tunisienne
        </AppText>
      </View>

      <View style={styles.body}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <AppText variant="label" color="inverse" style={styles.logoLetter}>
              R
            </AppText>
          </View>
          <AppText variant="label">rakeb</AppText>
        </View>

        <AppText variant="title">Partagez la route, partagez les frais.</AppText>
        <AppText variant="body" color="secondary">
          Trouvez un covoiturage entre Tunis, Sousse, Sfax — ou remplissez votre voiture et
          rentabilisez le trajet.
        </AppText>
      </View>

      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      <View style={styles.actions}>
        <AppButton label="Commencer" onPress={() => router.push('/(auth)/phone')} />
        <AppButton
          label="J’ai déjà un compte"
          variant="secondary"
          onPress={() => router.push('/(auth)/login')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    aspectRatio: 0.9,
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  body: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontWeight: '800',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.border.strong,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.brand.primary,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
});
