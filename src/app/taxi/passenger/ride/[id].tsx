import { Stack, router, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { normalizeError } from '@/api/errors';
import { AppButton, AppCard, AppText, ErrorView, LoadingView, Screen } from '@/components';
import { ActiveRideSheet } from '@/features/taxi/components/ActiveRideSheet';
import { useCancelTaxiRide, useTaxiRide } from '@/features/taxi/queries';
import { useTaxiRideLiveUpdates } from '@/features/taxi/use-taxi-ride-live-updates';
import { toCoordinate } from '@/services/maps/map-adapter';
import { RakebMapView } from '@/services/maps/MapView';
import type { MapMarker, MapPolyline } from '@/services/maps/types';
import { spacing } from '@/theme';

/**
 * Passenger's active ride: map with driver position + route, status
 * progress, cancel — real-time via `/ws/taxi`, HTTP polling as the
 * source-of-truth fallback (`useTaxiRide`'s `refetchInterval`).
 */
export default function TaxiPassengerRideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: ride, isLoading, isError, error, refetch } = useTaxiRide(id);
  useTaxiRideLiveUpdates(id);
  const cancel = useCancelTaxiRide();
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Votre course' }} />
        <LoadingView />
      </Screen>
    );
  }

  if (isError || !ride) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Votre course' }} />
        <ErrorView error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  function confirmCancel() {
    Alert.alert('Annuler la course ?', 'Cette action ne peut pas être annulée.', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, annuler',
        style: 'destructive',
        onPress: () => void doCancel(),
      },
    ]);
  }

  async function doCancel() {
    setCancelError(null);
    try {
      await cancel.mutateAsync({ rideId: ride!.id });
    } catch (err) {
      setCancelError(normalizeError(err).message);
    }
  }

  const markers: MapMarker[] = [
    { id: 'pickup', coordinate: toCoordinate(ride.pickup), kind: 'pickup' },
    { id: 'destination', coordinate: toCoordinate(ride.destination), kind: 'destination' },
  ];
  const polylines: MapPolyline[] =
    ride.route.length > 1
      ? [{ id: 'route', coordinates: ride.route.map(toCoordinate), color: 'accent', width: 4 }]
      : [];

  if (ride.status === 'trip_completed' || ride.status === 'cancelled' || ride.status === 'expired') {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Votre course' }} />
        <AppCard style={styles.summaryCard}>
          <AppText variant="title">
            {ride.status === 'trip_completed'
              ? 'Vous êtes arrivé'
              : ride.status === 'cancelled'
                ? 'Course annulée'
                : 'Course expirée'}
          </AppText>
          <AppText variant="body" color="secondary">
            {ride.status === 'trip_completed'
              ? `${ride.pickup_label} → ${ride.destination_label}`
              : (ride.cancellation_reason ??
                'Aucun chauffeur n’a accepté votre course à temps.')}
          </AppText>
          <AppButton
            label="Retour"
            onPress={() => router.replace('/taxi' as Href)}
            style={styles.doneButton}
          />
        </AppCard>
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Votre course' }} />

      <View style={styles.mapWrap}>
        <RakebMapView style={styles.map} showsUserLocation markers={markers} polylines={polylines} />
      </View>

      {cancelError ? <ErrorView error={cancelError} /> : null}

      <ActiveRideSheet ride={ride} onCancel={confirmCancel} cancelLoading={cancel.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mapWrap: { flex: 1 },
  map: { flex: 1 },
  summaryCard: { gap: spacing.sm, marginTop: spacing.md },
  doneButton: { marginTop: spacing.md },
});
