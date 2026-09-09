import { Stack, router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppText,
  EmptyView,
  ErrorView,
  LoadingView,
  Screen,
  StepIndicator,
  WizardFooter,
} from '@/components';
import { useRequirePublishStep } from '@/features/carpool/publishing/use-require-step';
import { useVehicles } from '@/features/carpool/vehicles/queries';
import { usePublishDraftStore } from '@/stores/publish-draft-store';
import { colors, radius, spacing } from '@/theme';

/** Step 3 — pick the vehicle for this trip. */
export default function PublishVehicleScreen() {
  const redirecting = useRequirePublishStep('vehicle');
  const vehicleId = usePublishDraftStore((s) => s.vehicleId);
  const setVehicle = usePublishDraftStore((s) => s.setVehicle);
  const { data: vehicles, isLoading, isError, error, refetch } = useVehicles();

  if (redirecting) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Véhicule' }} />
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Véhicule' }} />

      <StepIndicator step={3} total={6} />

      {isLoading ? (
        <LoadingView />
      ) : isError ? (
        <ErrorView error={error} onRetry={() => void refetch()} />
      ) : !vehicles || vehicles.length === 0 ? (
        <EmptyView
          title="Aucun véhicule"
          description="Ajoutez le véhicule avec lequel vous conduisez."
          actionLabel="Ajouter un véhicule"
          onAction={() => router.push('/carpool/vehicles/new')}
        />
      ) : (
        <View style={styles.sections}>
          {vehicles.map((vehicle) => (
            <Pressable
              key={vehicle.id}
              onPress={() => setVehicle(vehicle.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: vehicleId === vehicle.id }}
              accessibilityLabel={`${vehicle.make} ${vehicle.model}, ${vehicle.plate}`}
              style={[styles.row, vehicleId === vehicle.id && styles.rowOn]}
            >
              <View style={styles.text}>
                <AppText variant="subheading">
                  {vehicle.make} {vehicle.model}
                </AppText>
                <AppText variant="bodySmall" color="secondary">
                  {vehicle.color} · {vehicle.plate} · {vehicle.seats} places
                </AppText>
              </View>
              <View style={[styles.radio, vehicleId === vehicle.id && styles.radioOn]} />
            </Pressable>
          ))}

          <AppButton
            label="Ajouter un véhicule"
            variant="secondary"
            onPress={() => router.push('/carpool/vehicles/new')}
          />
        </View>
      )}

      <WizardFooter
        backHref="/carpool/publish/schedule"
        nextDisabled={!vehicleId}
        onNext={() => router.push('/carpool/publish/seats')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing.md, paddingTop: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  rowOn: { borderColor: colors.brand.primary, backgroundColor: colors.brand.primarySurface },
  text: { flex: 1, gap: spacing.xxs },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border.strong,
  },
  radioOn: { borderColor: colors.brand.primary, backgroundColor: colors.brand.primary },
  cta: { marginTop: spacing.xl },
});
