import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import {
  AppCard,
  AppText,
  EmptyView,
  ErrorView,
  LoadingView,
  Screen,
} from '@/components';
import { useMyTrips } from '@/features/carpool/publishing/queries';
import { TripStatusBadge } from '@/features/carpool/trips/components/TripStatusBadge';
import { colors, radius, spacing } from '@/theme';
import type { DriverTripBucket, TripSummary } from '@/types/models';
import { formatLongDate, formatIsoTime, parseIsoDate } from '@/utils/date';
import { formatMillimes } from '@/utils/money';

const TABS: { bucket: DriverTripBucket; label: string }[] = [
  { bucket: 'published', label: 'À venir' },
  { bucket: 'confirmed', label: 'Confirmés' },
  { bucket: 'completed', label: 'Terminés' },
  { bucket: 'cancelled', label: 'Annulés' },
];

/** Mes trajets publiés — the driver's trips, by state. */
export default function MyTripsScreen() {
  const [bucket, setBucket] = useState<DriverTripBucket>('published');
  const { data, isLoading, isError, error, refetch } = useMyTrips(bucket);
  const trips = data ?? [];

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'Mes trajets' }} />

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.bucket}
            onPress={() => setBucket(tab.bucket)}
            accessibilityRole="tab"
            accessibilityState={{ selected: bucket === tab.bucket }}
            style={[styles.tab, bucket === tab.bucket && styles.tabOn]}
          >
            <AppText variant="label" color={bucket === tab.bucket ? 'brand' : 'tertiary'}>
              {tab.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <LoadingView />
      ) : isError && trips.length === 0 ? (
        <ErrorView error={error} onRetry={() => void refetch()} />
      ) : trips.length === 0 ? (
        <EmptyView
          title="Aucun trajet"
          description={
            bucket === 'published'
              ? 'Publiez un trajet pour commencer à recevoir des demandes.'
              : 'Rien dans cette catégorie.'
          }
          actionLabel={bucket === 'published' ? 'Publier un trajet' : undefined}
          onAction={bucket === 'published' ? () => router.push('/carpool/publish') : undefined}
        />
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(trip) => trip.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.gap} />}
          renderItem={({ item }) => <TripRow trip={item} bucket={bucket} />}
        />
      )}
    </Screen>
  );
}

function TripRow({ trip }: { trip: TripSummary; bucket: DriverTripBucket }) {
  const departure = parseIsoDate(trip.departure_at);

  return (
    <AppCard
      onPress={() => router.push(`/carpool/requests/${trip.id}`)}
      accessibilityLabel={`Trajet ${trip.origin.label} vers ${trip.destination.label}`}
    >
      <View style={styles.rowTop}>
        <AppText variant="subheading">
          {trip.origin.governorate || trip.origin.label} → {trip.destination.governorate || trip.destination.label}
        </AppText>
        <AppText variant="bodySmall" color="brand">
          {formatMillimes(trip.price_per_seat, { compact: true })}
        </AppText>
      </View>
      <AppText variant="bodySmall" color="secondary">
        {departure ? `${formatLongDate(departure)} · ${formatIsoTime(trip.departure_at)}` : '—'}
      </AppText>
      <View style={styles.rowMeta}>
        <TripStatusBadge status={trip.status} />
        <AppText variant="caption" color="tertiary">
          {trip.seats_available} place{trip.seats_available > 1 ? 's' : ''} restante
          {trip.seats_available > 1 ? 's' : ''}
        </AppText>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.md },
  tab: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tabOn: { borderColor: colors.brand.primary, backgroundColor: colors.brand.primarySurface },
  list: { paddingBottom: spacing.xxl },
  gap: { height: spacing.md },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xxs,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
