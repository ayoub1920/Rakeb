import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { normalizeError } from '@/api/errors';
import { AppButton, AppText } from '@/components';
import { useReverseGeocode } from '@/features/places/queries';
import { RideRequestSheet } from '@/features/taxi/components/RideRequestSheet';
import { useCreateTaxiRide, useTaxiQuote } from '@/features/taxi/queries';
import { useTaxiPickupLocation } from '@/features/taxi/use-taxi-pickup-location';
import { toCoordinate } from '@/services/maps/map-adapter';
import { RakebMapView } from '@/services/maps/MapView';
import type { MapMarker, MapPolyline } from '@/services/maps/types';
import { useCanQuoteTaxiRide, useTaxiRideStore } from '@/stores/taxi-ride-store';
import { colors, spacing } from '@/theme';

/**
 * Taxi passenger search: real Google Maps, real current location (permission
 * requested only on explicit tap), pickup/destination selection, a quote
 * with real nearby approved drivers, and the "Commander" action.
 */
export default function TaxiPassengerSearchScreen() {
  const pickup = useTaxiRideStore((s) => s.pickup);
  const destination = useTaxiRideStore((s) => s.destination);
  const reset = useTaxiRideStore((s) => s.reset);
  const canQuote = useCanQuoteTaxiRide();

  const pickupLocation = useTaxiPickupLocation();
  const reverseGeocode = useReverseGeocode();
  const setPickup = useTaxiRideStore((s) => s.setPickup);

  const quote = useTaxiQuote();
  const createRide = useCreateTaxiRide();
  const [requestError, setRequestError] = useState<string | null>(null);

  // Clear a stale draft only when the screen is first opened, not on every render.
  useEffect(() => {
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pickup || !destination) return;
    quote.mutate({
      pickup_label: pickup.label,
      pickup: { lat: pickup.lat, lng: pickup.lng },
      destination_label: destination.label,
      destination: { lat: destination.lat, lng: destination.lng },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng]);

  useEffect(() => {
    if (pickupLocation.state !== 'ready' || !pickupLocation.coords || pickup) return;
    void reverseGeocode
      .mutateAsync(pickupLocation.coords)
      .then((place) => setPickup(place))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupLocation.state]);

  async function handleRequest() {
    if (!pickup || !destination) return;
    setRequestError(null);
    try {
      const ride = await createRide.mutateAsync({
        pickup_label: pickup.label,
        pickup: { lat: pickup.lat, lng: pickup.lng },
        destination_label: destination.label,
        destination: { lat: destination.lat, lng: destination.lng },
      });
      reset();
      router.replace({ pathname: '/taxi/passenger/ride/[id]', params: { id: ride.id } });
    } catch (error) {
      setRequestError(normalizeError(error).message);
    }
  }

  const markers: MapMarker[] = [
    ...(pickup ? [{ id: 'pickup', coordinate: toCoordinate(pickup), kind: 'pickup' as const }] : []),
    ...(destination
      ? [{ id: 'destination', coordinate: toCoordinate(destination), kind: 'destination' as const }]
      : []),
    ...(quote.data?.nearby_drivers.map((driver) => ({
      id: driver.application_id,
      coordinate: toCoordinate(driver.location),
      kind: 'driver' as const,
      title: driver.display_name,
      description: driver.plate_number,
    })) ?? []),
  ];

  const polylines: MapPolyline[] =
    quote.data && quote.data.route.length > 1
      ? [{ id: 'route', coordinates: quote.data.route.map(toCoordinate), color: 'accent', width: 4 }]
      : [];

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Commander un taxi' }} />

      <View style={styles.mapWrap}>
        <RakebMapView
          style={styles.map}
          showsUserLocation={pickupLocation.state === 'ready'}
          markers={markers}
          polylines={polylines}
        />

        {!pickup ? (
          <View style={styles.locateOverlay}>
            <AppButton
              label={pickupLocation.state === 'locating' ? 'Localisation…' : 'Utiliser ma position'}
              variant="secondary"
              onPress={() => void pickupLocation.locate()}
              loading={pickupLocation.state === 'locating' || reverseGeocode.isPending}
            />
            {pickupLocation.state === 'denied' ? (
              <AppText variant="caption" color="tertiary" style={styles.locateHint}>
                Localisation refusée — choisissez un point de départ manuellement ci-dessous.
              </AppText>
            ) : null}
          </View>
        ) : null}
      </View>

      <View>
        {requestError ? (
          <View style={styles.requestErrorBanner}>
            <AppText variant="bodySmall" color="error" align="center">
              {requestError}
            </AppText>
          </View>
        ) : null}
        <RideRequestSheet
          pickupLabel={pickup?.label ?? null}
          destinationLabel={destination?.label ?? null}
          onPressPickup={() => router.push('/(modals)/select-place?field=pickup&target=taxi')}
          onPressDestination={() =>
            router.push('/(modals)/select-place?field=destination&target=taxi')
          }
          onSwap={() => useTaxiRideStore.getState().swap()}
          quote={quote.data ?? null}
          quoteLoading={quote.isPending}
          quoteError={quote.isError ? quote.error : null}
          onRetryQuote={() => {
            if (pickup && destination) {
              quote.mutate({
                pickup_label: pickup.label,
                pickup: { lat: pickup.lat, lng: pickup.lng },
                destination_label: destination.label,
                destination: { lat: destination.lat, lng: destination.lng },
              });
            }
          }}
          onRequest={() => void handleRequest()}
          requestLoading={createRide.isPending}
          canRequest={canQuote}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.default },
  mapWrap: { flex: 1 },
  map: { flex: 1 },
  locateOverlay: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  locateHint: {
    backgroundColor: colors.background.default,
    padding: spacing.xs,
    borderRadius: 8,
  },
  requestErrorBanner: {
    padding: spacing.sm,
    backgroundColor: colors.status.errorSurface,
  },
});
