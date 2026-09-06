import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppCard, AppText } from '@/components';
import { colors, radius, spacing } from '@/theme';
import type { TripSummary } from '@/types/models';
import { formatIsoTime, formatShortDate, parseIsoDate } from '@/utils/date';
import { formatMillimes } from '@/utils/money';

export type TripSummaryCardProps = {
  trip: TripSummary;
  /** Defaults to opening the trip detail. Override on screens that need a different target. */
  onPress?: () => void;
};

/**
 * A trip as a single row: route, departure, price, seats left, driver.
 *
 * Lives in the trips feature, not `@/components`, because it knows the
 * `TripSummary` shape. Shared by the home screen's "près de vous" strip and the
 * search results list.
 */
export function TripSummaryCard({ trip, onPress }: TripSummaryCardProps) {
  const departure = parseIsoDate(trip.departure_at);
  const seatsLabel = `${trip.seats_available} ${trip.seats_available > 1 ? 'places' : 'place'}`;

  return (
    <AppCard
      onPress={onPress ?? (() => router.push(`/carpool/trip/${trip.id}`))}
      accessibilityLabel={`Trajet ${trip.origin.label} vers ${trip.destination.label}, ${formatMillimes(
        trip.price_per_seat,
      )} par place`}
    >
      <View style={styles.headerRow}>
        <View style={styles.route}>
          <AppText variant="subheading">{trip.origin.label}</AppText>
          <AppText variant="bodySmall" color="tertiary">
            →
          </AppText>
          <AppText variant="subheading">{trip.destination.label}</AppText>
        </View>
        <AppText variant="subheading" color="brand">
          {formatMillimes(trip.price_per_seat, { compact: true })}
        </AppText>
      </View>

      <View style={styles.metaRow}>
        <AppText variant="bodySmall" color="secondary">
          {departure ? `${formatShortDate(departure)} · ${formatIsoTime(trip.departure_at)}` : '—'}
        </AppText>
        <AppText variant="bodySmall" color="secondary">
          {seatsLabel}
        </AppText>
      </View>

      <View style={styles.footerRow}>
        <AppText variant="bodySmall" color="secondary">
          {trip.driver.first_name}
          {trip.driver.rating != null ? ` · ${trip.driver.rating.toFixed(1)} ★` : ''}
        </AppText>
        {trip.instant_book ? (
          <View style={styles.badge}>
            <AppText variant="caption" color="brand">
              Réservation immédiate
            </AppText>
          </View>
        ) : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  route: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  footerRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primarySurface,
  },
});
