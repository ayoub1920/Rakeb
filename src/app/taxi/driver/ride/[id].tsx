import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { normalizeError } from '@/api/errors';
import { AppButton, AppText, ErrorView, LoadingView, Screen } from '@/components';
import { TaxiRideStatusBadge } from '@/features/taxi/components/TaxiRideStatusBadge';
import { nextDriverActionLabel, nextDriverStatus } from '@/features/taxi/ride-status';
import { useCancelTaxiRide, useTaxiRide, useUpdateTaxiRideStatus } from '@/features/taxi/queries';
import { useTaxiRideLiveUpdates } from '@/features/taxi/use-taxi-ride-live-updates';
import { toCoordinate } from '@/services/maps/map-adapter';
import { RakebMapView } from '@/services/maps/MapView';
import { spacing } from '@/theme';

/**
 * Driver's active ride: map, one primary "advance" button whose label
 * follows the state machine (`nextDriverActionLabel`), cancel action.
 */
export default function TaxiDriverRideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: ride, isLoading, isError, error, refetch } = useTaxiRide(id);
  useTaxiRideLiveUpdates(id);
  const updateStatus = useUpdateTaxiRideStatus();
  const cancel = useCancelTaxiRide();
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Course en cours' }} />
        <LoadingView />
      </Screen>
    );
  }

  if (isError || !ride) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Course en cours' }} />
        <ErrorView error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  const nextStatus = nextDriverStatus(ride.status);
  const actionLabel = nextDriverActionLabel(ride.status);
  const destination = ride.status === 'trip_started' ? ride.destination : ride.pickup;

  async function advance() {
    if (!nextStatus) return;
    setActionError(null);
    try {
      await updateStatus.mutateAsync({ rideId: ride!.id, status: nextStatus as never });
      if (nextStatus === 'trip_completed') router.replace('/taxi/driver/online');
    } catch (err) {
      setActionError(normalizeError(err).message);
    }
  }

  async function doCancel() {
    setActionError(null);
    try {
      await cancel.mutateAsync({ rideId: ride!.id });
      router.replace('/taxi/driver/online');
    } catch (err) {
      setActionError(normalizeError(err).message);
    }
  }

  const canCancel = ride.status !== 'trip_completed' && ride.status !== 'cancelled';

  return (
    <Screen padded={false} scrollable={false}>
      <Stack.Screen options={{ title: 'Course en cours' }} />

      <View style={styles.mapWrap}>
        <RakebMapView
          style={styles.map}
          showsUserLocation
          markers={[
            { id: 'pickup', coordinate: toCoordinate(ride.pickup), kind: 'pickup' },
            { id: 'destination', coordinate: toCoordinate(ride.destination), kind: 'destination' },
          ]}
          polylines={
            ride.route.length > 1
              ? [{ id: 'route', coordinates: ride.route.map(toCoordinate), color: 'accent' }]
              : []
          }
        />
      </View>

      <View style={styles.panel}>
        <TaxiRideStatusBadge status={ride.status} />
        <AppText variant="title">
          {ride.status === 'trip_started' ? ride.destination_label : ride.pickup_label}
        </AppText>

        <AppButton
          label="Ouvrir dans Maps"
          variant="secondary"
          onPress={() => Linking.openURL(`https://maps.google.com/?q=${destination.lat},${destination.lng}`)}
        />

        {actionError ? (
          <AppText variant="bodySmall" color="error">
            {actionError}
          </AppText>
        ) : null}

        {actionLabel ? (
          <AppButton label={actionLabel} onPress={() => void advance()} loading={updateStatus.isPending} />
        ) : null}

        {canCancel ? (
          <AppButton
            label="Annuler la course"
            variant="danger"
            onPress={() => void doCancel()}
            loading={cancel.isPending}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapWrap: { flex: 1 },
  map: { flex: 1 },
  panel: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
