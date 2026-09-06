import { Stack, useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppText, ErrorView, LoadingView, Screen } from '@/components';
import { useBooking } from '@/features/carpool/bookings/queries';
import { useTripTracking } from '@/features/carpool/tracking/queries';
import { useTrip } from '@/features/carpool/trips/queries';
import { MapPlaceholder } from '@/services/maps/MapPlaceholder';
import { colors, radius, spacing } from '@/theme';
import type { Trip, TripTracking } from '@/types/models';

/**
 * Live tracking.
 *
 * Three sources compose this screen: `useTripTracking` for the position and
 * ETA, `useTrip` for the driver and vehicle, and `useBooking` for the rider's
 * passenger code. The map is the placeholder from `services/maps`.
 */
export default function TrackingScreen() {
  const { tripId, bookingId } = useLocalSearchParams<{ tripId: string; bookingId?: string }>();
  const tracking = useTripTracking(tripId);
  const trip = useTrip(tripId);
  const booking = useBooking(bookingId);

  if (tracking.isLoading || trip.isLoading) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Suivi en direct' }} />
        <LoadingView />
      </Screen>
    );
  }

  if ((tracking.isError || !tracking.data) && !trip.data) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Suivi en direct' }} />
        <ErrorView error={tracking.error} onRetry={() => void tracking.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen scrollable padded={false}>
      <Stack.Screen options={{ title: 'Suivi en direct' }} />
      <TrackingBody
        tracking={tracking.data ?? null}
        trip={trip.data ?? null}
        passengerCode={booking.data?.passenger_code ?? null}
      />
    </Screen>
  );
}

function headline(tracking: TripTracking | null, driverName: string): string {
  if (!tracking) return 'Suivi indisponible';
  if (tracking.state === 'completed') return 'Trajet terminé';
  if (tracking.state === 'in_progress') {
    return tracking.eta_minutes != null
      ? `Arrivée estimée dans ${tracking.eta_minutes} min`
      : 'Trajet en cours';
  }
  return `En attente du départ · ${driverName} n’a pas encore démarré`;
}

function TrackingBody({
  tracking,
  trip,
  passengerCode,
}: {
  tracking: TripTracking | null;
  trip: Trip | null;
  passengerCode: string | null;
}) {
  const driverName = trip?.driver.first_name ?? 'Le conducteur';

  return (
    <View>
      <MapPlaceholder
        height={260}
        markers={
          tracking?.driver_location
            ? [
                {
                  id: 'driver',
                  kind: 'driver',
                  coordinate: {
                    latitude: tracking.driver_location.lat,
                    longitude: tracking.driver_location.lng,
                  },
                  title: driverName,
                },
              ]
            : []
        }
      />

      <View style={styles.padded}>
        <View style={styles.headline}>
          <AppText variant="heading">{headline(tracking, driverName)}</AppText>
          {tracking && tracking.traffic !== 'unknown' ? (
            <AppText variant="bodySmall" color="secondary">
              Trafic {tracking.traffic === 'slow' ? 'chargé' : 'fluide'}
              {tracking.live ? ' · position en direct' : ''}
            </AppText>
          ) : null}
        </View>

        {trip ? (
          <AppCard>
            <View style={styles.driverRow}>
              <View style={styles.avatar}>
                <AppText variant="subheading" color="inverse">
                  {driverName.slice(0, 1).toUpperCase()}
                </AppText>
              </View>
              <View style={styles.driverText}>
                <AppText variant="subheading">{driverName}</AppText>
                <AppText variant="bodySmall" color="secondary">
                  {trip.driver.rating != null ? `★ ${trip.driver.rating.toFixed(1)} · ` : ''}
                  {trip.vehicle.model} {trip.vehicle.color.toLowerCase()}
                </AppText>
              </View>
            </View>
          </AppCard>
        ) : null}

        {passengerCode ? (
          <AppCard style={styles.codeCard}>
            <AppText variant="caption" color="tertiary">
              Code passager
            </AppText>
            <AppText variant="title" color="brand">
              {passengerCode}
            </AppText>
            <AppText variant="bodySmall" color="secondary">
              Donnez-le à {driverName} pour démarrer le trajet.
            </AppText>
          </AppCard>
        ) : null}

        <AppButton
          label="Ouvrir dans Maps"
          variant="secondary"
          onPress={() => {
            if (tracking?.driver_location) {
              void Linking.openURL(
                `https://maps.google.com/?q=${tracking.driver_location.lat},${tracking.driver_location.lng}`,
              );
            }
          }}
          disabled={!tracking?.driver_location}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  padded: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  headline: {
    gap: spacing.xxs,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverText: {
    flex: 1,
    gap: spacing.xxs,
  },
  codeCard: {
    gap: spacing.xxs,
  },
});
