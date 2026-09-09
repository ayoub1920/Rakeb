import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { flattenPages } from '@/api/pagination';
import {
  AppCard,
  AppText,
  EmptyView,
  ErrorView,
  LoadingView,
  Screen,
  ScreenHeader,
} from '@/components';
import { useBookings } from '@/features/carpool/bookings/queries';
import { usePendingReviews } from '@/features/carpool/reviews/queries';
import { BookingStatusBadge } from '@/features/carpool/trips/components/TripStatusBadge';
import { colors, radius, spacing } from '@/theme';
import type { Booking, BookingBucket } from '@/types/models';
import { formatLongDate, formatIsoTime, parseIsoDate } from '@/utils/date';
import { formatMillimes } from '@/utils/money';

const TABS: { bucket: BookingBucket; label: string }[] = [
  { bucket: 'upcoming', label: 'À venir' },
  { bucket: 'past', label: 'Passés' },
  { bucket: 'cancelled', label: 'Annulés' },
];

/** Activité — the passenger's bookings, split into upcoming / past / cancelled. */
export default function ActivityScreen() {
  const { t } = useTranslation();
  const [bucket, setBucket] = useState<BookingBucket>('upcoming');
  const query = useBookings(bucket);
  const bookings = flattenPages(query.data);
  const pendingReviews = usePendingReviews();
  const toRate = pendingReviews.data ?? [];

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('tabs.activity')} subtitle="Vos réservations et vos trajets" />

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.bucket}
            onPress={() => setBucket(tab.bucket)}
            accessibilityRole="tab"
            accessibilityState={{ selected: bucket === tab.bucket }}
            style={[styles.tab, bucket === tab.bucket && styles.tabActive]}
          >
            <AppText variant="label" color={bucket === tab.bucket ? 'brand' : 'tertiary'}>
              {tab.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      {bucket === 'past' && toRate.length > 0 ? (
        <AppCard
          style={styles.rateCard}
          onPress={() => router.push(`/carpool/review/${toRate[0].booking_id}`)}
        >
          <AppText variant="subheading">
            {toRate.length === 1
              ? 'Un trajet à noter'
              : `${toRate.length} trajets à noter`}
          </AppText>
          <AppText variant="bodySmall" color="secondary">
            {toRate[0].trip_label} · avec {toRate[0].peer_first_name}
          </AppText>
        </AppCard>
      ) : null}

      {query.isLoading ? (
        <LoadingView />
      ) : query.isError && bookings.length === 0 ? (
        <ErrorView error={query.error} onRetry={() => void query.refetch()} />
      ) : bookings.length === 0 ? (
        <EmptyView
          title="Rien ici pour l’instant"
          description={
            bucket === 'upcoming'
              ? 'Vos trajets réservés apparaîtront ici.'
              : 'Aucun trajet dans cette catégorie.'
          }
          actionLabel={bucket === 'upcoming' ? 'Chercher un trajet' : undefined}
          onAction={bucket === 'upcoming' ? () => router.push('/carpool/search') : undefined}
        />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.gap} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          renderItem={({ item }) => <BookingRow booking={item} />}
        />
      )}
    </Screen>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  const departure = parseIsoDate(booking.trip.departure_at);

  return (
    <AppCard
      onPress={() => router.push(`/carpool/booking/${booking.id}`)}
      accessibilityLabel={`Réservation ${booking.trip.origin.label} vers ${booking.trip.destination.label}`}
    >
      <View style={styles.rowTop}>
        <AppText variant="subheading">
          {booking.trip.origin.governorate} → {booking.trip.destination.governorate}
        </AppText>
        <AppText variant="bodySmall" color="brand">
          {formatMillimes(booking.total_price, { compact: true })}
        </AppText>
      </View>
      <AppText variant="bodySmall" color="secondary">
        {departure ? `${formatLongDate(departure)} · ${formatIsoTime(booking.trip.departure_at)}` : '—'}
      </AppText>
      <View style={styles.rowBottom}>
        <BookingStatusBadge status={booking.status} />
        <AppText variant="caption" color="tertiary">
          {booking.trip.driver.first_name} · {booking.reservation_code}
        </AppText>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  tab: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tabActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primarySurface,
  },
  list: {
    paddingVertical: spacing.md,
  },
  gap: {
    height: spacing.md,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xxs,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  rateCard: {
    gap: spacing.xxs,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
});
