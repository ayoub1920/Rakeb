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
import { colors, radius, spacing } from '@/theme';
import type { Booking, BookingBucket, BookingStatus } from '@/types/models';
import { formatLongDate, formatIsoTime, parseIsoDate } from '@/utils/date';
import { formatMillimes } from '@/utils/money';

const TABS: { bucket: BookingBucket; label: string }[] = [
  { bucket: 'upcoming', label: 'À venir' },
  { bucket: 'past', label: 'Passés' },
  { bucket: 'cancelled', label: 'Annulés' },
];

const STATUS_LABEL: Partial<Record<BookingStatus, string>> = {
  pending: 'En attente d’acceptation',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  completed: 'Terminé',
  declined: 'Refusé',
  cancelled_by_rider: 'Annulé',
  cancelled_by_driver: 'Annulé par le conducteur',
  expired: 'Expiré',
};

/** Activité — the passenger's bookings, split into upcoming / past / cancelled. */
export default function ActivityScreen() {
  const { t } = useTranslation();
  const [bucket, setBucket] = useState<BookingBucket>('upcoming');
  const query = useBookings(bucket);
  const bookings = flattenPages(query.data);

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
        <View style={styles.statusPill}>
          <AppText variant="caption" color="secondary">
            {STATUS_LABEL[booking.status] ?? booking.status}
          </AppText>
        </View>
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
  statusPill: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background.surface,
  },
});
