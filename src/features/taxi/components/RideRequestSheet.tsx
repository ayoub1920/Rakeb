import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, AppText, ErrorView } from '@/components';
import { colors, radius, spacing } from '@/theme';
import { formatMillimes } from '@/utils/money';

import { DriverCandidateCard } from './DriverCandidateCard';
import type { TaxiRideQuote } from '../types';

/**
 * Bottom panel over the passenger search map — pickup/destination rows,
 * quote summary once both points are set, and the primary CTA. A plain
 * anchored panel (not a dismissible `Modal`) since it must coexist with the
 * map, matching `(modals)/pick-on-map.tsx`'s bottom-panel pattern.
 */
export function RideRequestSheet({
  pickupLabel,
  destinationLabel,
  onPressPickup,
  onPressDestination,
  onSwap,
  quote,
  quoteLoading,
  quoteError,
  onRetryQuote,
  onRequest,
  requestLoading,
  canRequest,
}: {
  pickupLabel: string | null;
  destinationLabel: string | null;
  onPressPickup: () => void;
  onPressDestination: () => void;
  onSwap: () => void;
  quote: TaxiRideQuote | null;
  quoteLoading: boolean;
  quoteError: unknown;
  onRetryQuote: () => void;
  onRequest: () => void;
  requestLoading: boolean;
  canRequest: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.panel,
        { paddingBottom: Math.max(insets.bottom, spacing.md) },
        Platform.OS === 'ios' ? styles.iosPadding : null,
      ]}
    >
      <View style={styles.fields}>
        <View style={styles.fieldColumn}>
          <PlaceField
            icon="ellipse"
            iconColor={colors.brand.primary}
            placeholder="Point de prise en charge"
            value={pickupLabel}
            onPress={onPressPickup}
          />
          <View style={styles.divider} />
          <PlaceField
            icon="square"
            iconColor={colors.brand.accent}
            placeholder="Destination"
            value={destinationLabel}
            onPress={onPressDestination}
          />
        </View>
        <Pressable
          onPress={onSwap}
          accessibilityRole="button"
          accessibilityLabel="Inverser le départ et la destination"
          hitSlop={8}
          style={styles.swapButton}
        >
          <Ionicons name="swap-vertical" size={18} color={colors.text.secondary} />
        </Pressable>
      </View>

      {quoteLoading ? (
        <AppText variant="bodySmall" color="tertiary" style={styles.status}>
          Calcul de l’itinéraire…
        </AppText>
      ) : quoteError ? (
        <ErrorView error={quoteError} onRetry={onRetryQuote} />
      ) : quote ? (
        <View style={styles.quote}>
          <View style={styles.quoteHeader}>
            <AppText variant="title" color="brand">
              {formatMillimes(quote.estimated_price)}
            </AppText>
            <AppText variant="caption" color="tertiary">
              {(quote.distance_m / 1000).toFixed(1)} km · {Math.round(quote.duration_s / 60)} min
            </AppText>
          </View>
          {quote.nearby_drivers.length > 0 ? (
            <View style={styles.driverList}>
              {quote.nearby_drivers.slice(0, 3).map((driver) => (
                <DriverCandidateCard key={driver.application_id} driver={driver} />
              ))}
              {quote.nearby_drivers.length > 3 ? (
                <AppText variant="caption" color="tertiary">
                  +{quote.nearby_drivers.length - 3} autre(s) à proximité
                </AppText>
              ) : null}
            </View>
          ) : (
            <AppText variant="bodySmall" color="tertiary" style={styles.status}>
              Aucun taxi disponible à proximité pour le moment.
            </AppText>
          )}
        </View>
      ) : null}

      <AppButton
        label={quote && quote.nearby_drivers.length === 0 ? 'Aucun taxi disponible' : 'Commander un taxi'}
        onPress={onRequest}
        loading={requestLoading}
        disabled={!canRequest || (quote?.nearby_drivers.length ?? 0) === 0}
        style={styles.cta}
      />
    </View>
  );
}

function PlaceField({
  icon,
  iconColor,
  placeholder,
  value,
  onPress,
}: {
  icon: 'ellipse' | 'square';
  iconColor: string;
  placeholder: string;
  value: string | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ?? placeholder}
      style={styles.fieldRow}
    >
      <Ionicons name={icon} size={10} color={iconColor} />
      <AppText variant="body" color={value ? 'primary' : 'tertiary'} numberOfLines={1} style={styles.fieldText}>
        {value ?? placeholder}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background.default,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: -4 } },
      android: { elevation: 8 },
      default: {},
    }),
  },
  iosPadding: {
    paddingBottom: spacing.xl,
  },
  fields: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fieldColumn: {
    flex: 1,
    backgroundColor: colors.background.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
  },
  fieldText: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    textAlign: 'center',
  },
  quote: {
    gap: spacing.sm,
  },
  quoteHeader: {
    gap: spacing.xxs,
  },
  driverList: {
    gap: spacing.sm,
  },
  cta: {
    marginTop: spacing.xxs,
  },
});
