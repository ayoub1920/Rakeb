import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppText,
  ErrorView,
  LoadingView,
  Screen,
} from '@/components';
import { useTrip } from '@/features/carpool/trips/queries';
import { colors, radius, spacing } from '@/theme';
import type { Place, Trip } from '@/types/models';
import { formatIsoTime, formatLongDate, parseIsoDate } from '@/utils/date';
import { formatMillimes } from '@/utils/money';

/** Trip detail — itinerary, driver, vehicle, policy, and the entry to booking. */
export default function TripDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip, isLoading, isError, error, refetch } = useTrip(id);

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Détail du trajet' }} />

      {isLoading ? (
        <LoadingView />
      ) : isError || !trip ? (
        <ErrorView error={error} onRetry={() => void refetch()} />
      ) : (
        <TripDetail trip={trip} />
      )}
    </Screen>
  );
}

function TripDetail({ trip }: { trip: Trip }) {
  const departure = parseIsoDate(trip.departure_at);
  const soldOut = trip.seats_available <= 0;

  return (
    <View style={styles.sections}>
      <View>
        <AppText variant="caption" color="tertiary">
          {departure ? formatLongDate(departure) : ''}
        </AppText>
        <Itinerary
          origin={trip.origin}
          destination={trip.destination}
          stops={trip.stops}
          departureLabel={formatIsoTime(trip.departure_at)}
        />
      </View>

      <AppCard>
        <View style={styles.driverRow}>
          <View style={styles.avatar}>
            <AppText variant="subheading" color="inverse">
              {trip.driver.first_name.slice(0, 1).toUpperCase()}
            </AppText>
          </View>
          <View style={styles.driverText}>
            <AppText variant="subheading">{trip.driver.first_name}</AppText>
            <AppText variant="bodySmall" color="secondary">
              {trip.driver.rating != null ? `★ ${trip.driver.rating.toFixed(1)}` : 'Nouveau membre'}
              {'  ·  CIN vérifiée'}
            </AppText>
          </View>
        </View>

        <View style={styles.divider} />

        <InfoRow label="Véhicule" value={`${trip.vehicle.model} · ${trip.vehicle.color}`} />
        {trip.max_two_in_back ? (
          <InfoRow label="Confort" value="Maximum 2 à l’arrière" />
        ) : null}
        <InfoRow
          label="Places"
          value={
            soldOut
              ? 'Complet'
              : `${trip.seats_available} disponible${trip.seats_available > 1 ? 's' : ''}`
          }
        />
        {trip.instant_book ? (
          <View style={styles.badge}>
            <AppText variant="caption" color="brand">
              Réservation immédiate — sans attendre l’accord du conducteur
            </AppText>
          </View>
        ) : null}
      </AppCard>

      <AppCard>
        <AppText variant="label" color="secondary">
          Politique d’annulation
        </AppText>
        <AppText variant="bodySmall" color="secondary" style={styles.policy}>
          {trip.cancellation_policy}
        </AppText>
      </AppCard>

      <View style={styles.footer}>
        <View>
          <AppText variant="caption" color="tertiary">
            par place
          </AppText>
          <AppText variant="title" color="brand">
            {formatMillimes(trip.price_per_seat)}
          </AppText>
        </View>
        <AppButton
          label={soldOut ? 'Complet' : trip.instant_book ? 'Réserver' : 'Demander une place'}
          disabled={soldOut}
          onPress={() => router.push(`/carpool/book/${trip.id}`)}
          fullWidth={false}
          style={styles.cta}
        />
      </View>
    </View>
  );
}

function Itinerary({
  origin,
  destination,
  stops,
  departureLabel,
}: {
  origin: Place;
  destination: Place;
  stops: Place[];
  departureLabel: string;
}) {
  const points = [
    { place: origin, time: departureLabel },
    ...stops.map((place) => ({ place, time: null })),
    { place: destination, time: null },
  ];

  return (
    <View style={styles.itinerary}>
      {points.map((point, index) => (
        <Fragment key={point.place.id}>
          <View style={styles.stopRow}>
            <View style={styles.stopMarkerColumn}>
              <View style={[styles.dot, index === 0 && styles.dotStart]} />
              {index < points.length - 1 ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.stopText}>
              <AppText variant="body">{point.place.label}</AppText>
              <AppText variant="caption" color="tertiary">
                {point.place.governorate}
                {point.time ? ` · ${point.time}` : ''}
              </AppText>
            </View>
          </View>
        </Fragment>
      ))}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText variant="bodySmall" color="tertiary">
        {label}
      </AppText>
      <AppText variant="bodySmall">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: spacing.xl,
    paddingTop: spacing.md,
  },
  itinerary: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  stopRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stopMarkerColumn: {
    alignItems: 'center',
    width: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    marginTop: spacing.xs,
  },
  dotStart: {
    backgroundColor: colors.brand.accent,
  },
  line: {
    flex: 1,
    width: StyleSheet.hairlineWidth * 2,
    backgroundColor: colors.border.strong,
    marginVertical: spacing.xxs,
  },
  stopText: {
    flex: 1,
    paddingBottom: spacing.md,
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  badge: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.brand.primarySurface,
  },
  policy: {
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingTop: spacing.md,
  },
  cta: {
    minWidth: 180,
  },
});
