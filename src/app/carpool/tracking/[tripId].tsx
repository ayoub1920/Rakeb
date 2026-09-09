import { Stack, useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppText, ErrorView, LoadingView, Screen } from '@/components';
import { useBooking } from '@/features/carpool/bookings/queries';
import { useTripTracking } from '@/features/carpool/tracking/queries';
import { useTripLiveUpdates } from '@/features/carpool/tracking/use-trip-live-updates';
import { useTrip } from '@/features/carpool/trips/queries';
import { RakebMapView } from '@/services/maps/MapView';
import type { MapMarker, MapPolyline } from '@/services/maps/types';
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
  // Live `/ws/trips` layer — folds position/ETA events into the tracking cache.
  // Purely additive; the poll above stays the source of truth.
  useTripLiveUpdates(tripId);

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

  const markers: MapMarker[] = [];
  if (trip) {
    markers.push({
      id: 'origin',
      kind: 'origin',
      coordinate: { latitude: trip.origin.lat, longitude: trip.origin.lng },
      title: trip.origin.label,
    });
    markers.push({
      id: 'destination',
      kind: 'destination',
      coordinate: { latitude: trip.destination.lat, longitude: trip.destination.lng },
      title: trip.destination.label,
    });
  }
  if (tracking?.driver_location) {
    markers.push({
      id: 'driver',
      kind: 'driver',
      coordinate: {
        latitude: tracking.driver_location.lat,
        longitude: tracking.driver_location.lng,
      },
      title: driverName,
      description: tracking.live ? 'Position en direct' : 'Dernière position connue',
    });
  }

  const polylines: MapPolyline[] =
    trip?.route && trip.route.length >= 2
      ? [
          {
            id: 'route',
            coordinates: trip.route.map((point) => ({
              latitude: point.lat,
              longitude: point.lng,
            })),
            width: 5,
          },
        ]
      : [];

  return (
    <View>
      <RakebMapView height={260} markers={markers} polylines={polylines} showsUserLocation />

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

        <TripTimeline tracking={tracking} />

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
              {tracking?.state === 'in_progress'
                ? `Communiquez-le à ${driverName} à la montée.`
                : `Donnez-le à ${driverName} au départ.`}
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

const TIMELINE_STEPS = ['Prévu', 'Démarré', 'En route', 'Arrivé'] as const;

function currentStep(tracking: TripTracking | null): number {
  if (!tracking) return 0;
  if (tracking.state === 'completed') return 3;
  if (tracking.state === 'in_progress') {
    return tracking.driver_location || tracking.eta_minutes != null ? 2 : 1;
  }
  return 0;
}

function TripTimeline({ tracking }: { tracking: TripTracking | null }) {
  const step = currentStep(tracking);
  return (
    <View style={styles.timeline}>
      {TIMELINE_STEPS.map((label, index) => {
        const done = index <= step;
        return (
          <View key={label} style={styles.timelineItem}>
            <View style={[styles.timelineDot, done && styles.timelineDotOn]} />
            {index < TIMELINE_STEPS.length - 1 ? (
              <View style={[styles.timelineBar, index < step && styles.timelineBarOn]} />
            ) : null}
            <AppText
              variant="caption"
              color={done ? 'brand' : 'tertiary'}
              style={styles.timelineLabel}
            >
              {label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  padded: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineItem: {
    flex: 1,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.border.strong,
  },
  timelineDotOn: {
    backgroundColor: colors.brand.primary,
  },
  timelineBar: {
    position: 'absolute',
    top: 5,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: colors.border.strong,
  },
  timelineBarOn: {
    backgroundColor: colors.brand.primary,
  },
  timelineLabel: {
    marginTop: spacing.xs,
    textAlign: 'center',
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
