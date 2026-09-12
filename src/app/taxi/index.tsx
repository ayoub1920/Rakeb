import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Screen } from '@/components';
import { TaxiPathChoiceCard } from '@/features/taxi/components/TaxiPathChoiceCard';
import { taxiApplicationStatusLabel } from '@/features/taxi/components/TaxiApplicationStatusBadge';
import { useTaxiApplication } from '@/features/taxi/queries';
import { colors, radius, spacing } from '@/theme';

/**
 * Taxi service entry page. Opened from the services catalogue
 * (`ServiceShortcuts` / `ServiceList` → `/taxi`, `service-registry.ts`).
 *
 * Two paths, no third option: passenger search is open to anyone; the
 * driver card reflects an existing application's status when there is one,
 * so a returning driver lands on their status instead of a blank form.
 */
export default function TaxiLandingScreen() {
  const { data: application } = useTaxiApplication();

  const driverSubtitle = application
    ? `Candidature : ${taxiApplicationStatusLabel(application.status)}`
    : undefined;

  function openDriverPath() {
    if (!application) {
      router.push('/taxi/driver/apply');
    } else if (application.status === 'approved') {
      router.push('/taxi/driver/online');
    } else {
      router.push('/taxi/driver/status');
    }
  }

  return (
    <Screen scrollable edges={['bottom']}>
      <Stack.Screen options={{ title: 'Taxi' }} />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="car-sport" size={40} color={colors.brand.primary} />
        </View>
        <AppText variant="title" align="center">
          Un taxi, en quelques minutes
        </AppText>
        <AppText variant="body" color="secondary" align="center">
          Commandez une course en ville, ou proposez vos services comme
          chauffeur de taxi.
        </AppText>
      </View>

      <View style={styles.choices}>
        <TaxiPathChoiceCard
          icon="person-outline"
          title="Passager"
          description="Trouvez un taxi disponible près de vous et suivez votre course en direct."
          onPress={() => router.push('/taxi/passenger/search')}
          testID="taxi-choice-passenger"
        />
        <TaxiPathChoiceCard
          icon="car-outline"
          title="Chauffeur de taxi"
          description="Déposez votre candidature avec vos documents pour commencer à recevoir des courses."
          subtitle={driverSubtitle}
          onPress={openDriverPath}
          testID="taxi-choice-driver"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  choices: {
    gap: spacing.md,
  },
});
