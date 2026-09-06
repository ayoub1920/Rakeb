import { Stack, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppText,
  EmptyView,
  ErrorView,
  LoadingView,
  Screen,
} from '@/components';
import { useVehicles } from '@/features/carpool/vehicles/queries';
import { colors, radius, spacing } from '@/theme';

/** Mes véhicules — the driver's saved vehicles. */
export default function VehiclesScreen() {
  const { data: vehicles, isLoading, isError, error, refetch } = useVehicles();

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Mes véhicules' }} />

      {isLoading ? (
        <LoadingView />
      ) : isError ? (
        <ErrorView error={error} onRetry={() => void refetch()} />
      ) : !vehicles || vehicles.length === 0 ? (
        <EmptyView
          title="Aucun véhicule"
          description="Ajoutez un véhicule pour pouvoir proposer des trajets."
          actionLabel="Ajouter un véhicule"
          onAction={() => router.push('/carpool/vehicles/new')}
        />
      ) : (
        <View style={styles.sections}>
          {vehicles.map((vehicle) => (
            <AppCard
              key={vehicle.id}
              onPress={() => router.push(`/carpool/vehicles/${vehicle.id}`)}
              accessibilityLabel={`${vehicle.make} ${vehicle.model}, ${vehicle.plate}`}
            >
              <View style={styles.rowTop}>
                <AppText variant="subheading">
                  {vehicle.make} {vehicle.model}
                </AppText>
                {vehicle.is_default ? (
                  <View style={styles.badge}>
                    <AppText variant="caption" color="brand">
                      Par défaut
                    </AppText>
                  </View>
                ) : null}
              </View>
              <AppText variant="bodySmall" color="secondary">
                {vehicle.color} · {vehicle.plate}
                {vehicle.year ? ` · ${vehicle.year}` : ''} · {vehicle.seats} places
              </AppText>
            </AppCard>
          ))}

          <AppButton
            label="Ajouter un véhicule"
            variant="secondary"
            onPress={() => router.push('/carpool/vehicles/new')}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing.md, paddingTop: spacing.md },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xxs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primarySurface,
  },
});
