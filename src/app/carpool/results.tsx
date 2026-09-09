import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { flattenPages } from '@/api/pagination';
import { AppText, EmptyView, ErrorView, LoadingView, Screen } from '@/components';
import { useTripSearch, useTripSearchMap } from '@/features/carpool/search/queries';
import type { TripSearchFilter } from '@/features/carpool/search/types';
import { TripSummaryCard } from '@/features/carpool/trips/components/TripSummaryCard';
import { RakebMapView } from '@/services/maps/MapView';
import { useCarpoolSearchStore } from '@/stores/carpool-search-store';
import { colors, radius, spacing } from '@/theme';
import type { TripSortOption } from '@/types/models';

const SORTS: { value: TripSortOption; label: string }[] = [
  { value: 'departure', label: 'Départ tôt' },
  { value: 'price', label: 'Prix' },
  { value: 'rating', label: 'Note' },
];

const FILTERS: { value: TripSearchFilter; label: string }[] = [
  { value: 'direct', label: 'Direct' },
  { value: 'instant_book', label: 'Réservation immédiate' },
  { value: 'verified', label: 'Conducteur vérifié' },
];

/** Search results — the canonical infinite list, with sort, filters and a map toggle. */
export default function ResultsScreen() {
  const origin = useCarpoolSearchStore((s) => s.origin);
  const destination = useCarpoolSearchStore((s) => s.destination);
  const date = useCarpoolSearchStore((s) => s.date);
  const seats = useCarpoolSearchStore((s) => s.seats);

  const [sort, setSort] = useState<TripSortOption>('departure');
  const [filters, setFilters] = useState<TripSearchFilter[]>([]);
  const [showMap, setShowMap] = useState(false);

  const params = useMemo(
    () =>
      origin && destination
        ? {
            from_place_id: origin.id,
            to_place_id: destination.id,
            date: date ?? undefined,
            seats,
            sort,
            filters: filters.length ? filters : undefined,
          }
        : null,
    [origin, destination, date, seats, sort, filters],
  );

  const query = useTripSearch(params);
  const mapQuery = useTripSearchMap(params, showMap);
  const trips = flattenPages(query.data);

  function toggleFilter(value: TripSearchFilter) {
    setFilters((current) =>
      current.includes(value) ? current.filter((f) => f !== value) : [...current, value],
    );
  }

  if (!params) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Trajets' }} />
        <EmptyView
          title="Choisissez un trajet"
          description="Indiquez un départ et une arrivée pour voir les trajets disponibles."
          actionLabel="Modifier la recherche"
          onAction={() => router.navigate('/carpool/search')}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <Stack.Screen
        options={{ title: `${origin!.governorate} → ${destination!.governorate}` }}
      />

      <View style={styles.controls}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipTrack}
        >
          {SORTS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              active={sort === option.value}
              onPress={() => setSort(option.value)}
            />
          ))}
          <View style={styles.chipDivider} />
          {FILTERS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              active={filters.includes(option.value)}
              onPress={() => toggleFilter(option.value)}
            />
          ))}
        </ScrollView>

        <Pressable
          onPress={() => setShowMap((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={showMap ? 'Voir la liste' : 'Voir la carte'}
          accessibilityState={{ selected: showMap }}
          style={styles.mapToggle}
        >
          <AppText variant="label" color="brand">
            {showMap ? 'Liste' : 'Carte'}
          </AppText>
        </Pressable>
      </View>

      {query.isLoading ? (
        <LoadingView label="Recherche des trajets…" />
      ) : query.isError && trips.length === 0 ? (
        <ErrorView error={query.error} onRetry={() => void query.refetch()} />
      ) : trips.length === 0 ? (
        <EmptyView
          title="Aucun trajet ce jour-là"
          description="Essayez une autre date ou créez une alerte pour ce trajet."
          actionLabel="Modifier la recherche"
          onAction={() => router.navigate('/carpool/search')}
        />
      ) : showMap ? (
        <ScrollView contentContainerStyle={styles.mapWrap}>
          <RakebMapView
            height={320}
            markers={
              mapQuery.data?.markers ??
              trips.map((trip) => ({
                id: `${trip.id}:origin`,
                kind: 'origin' as const,
                coordinate: { latitude: trip.origin.lat, longitude: trip.origin.lng },
                title: `${trip.origin.label} → ${trip.destination.label}`,
              }))
            }
            polylines={mapQuery.data?.polylines ?? []}
          />
          <AppText variant="bodySmall" color="secondary">
            {(mapQuery.data?.total ?? trips.length)} trajet
            {(mapQuery.data?.total ?? trips.length) > 1 ? 's' : ''}
            {mapQuery.isLoading ? ' · chargement de la carte…' : ''} · touchez « Liste » pour
            réserver.
          </AppText>
        </ScrollView>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(trip) => trip.id}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          ListHeaderComponent={
            <AppText variant="bodySmall" color="secondary" style={styles.count}>
              {(query.data?.pages[0]?.total ?? trips.length)} trajets ·{' '}
              {seats > 1 ? `${seats} places` : '1 place'}
            </AppText>
          }
          ListFooterComponent={
            query.isFetchingNextPage ? <LoadingView fullscreen={false} label="" /> : null
          }
          renderItem={({ item }) => <TripSummaryCard trip={item} />}
          ItemSeparatorComponent={() => <View style={styles.gap} />}
        />
      )}
    </Screen>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <AppText variant="caption" color={active ? 'inverse' : 'primary'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  chipTrack: {
    gap: spacing.sm,
    alignItems: 'center',
    paddingRight: spacing.sm,
  },
  chipDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: spacing.xs,
    backgroundColor: colors.border.strong,
  },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.background.surfaceRaised,
  },
  chipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  mapToggle: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  count: {
    paddingBottom: spacing.md,
  },
  gap: {
    height: spacing.md,
  },
  mapWrap: {
    padding: spacing.lg,
    gap: spacing.md,
  },
});
