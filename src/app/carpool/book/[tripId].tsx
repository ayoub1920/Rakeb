import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { getFieldError, normalizeError } from '@/api/errors';
import {
  AppButton,
  AppCard,
  AppInput,
  AppText,
  ErrorView,
  LoadingView,
  Screen,
} from '@/components';
import { useCreateBooking } from '@/features/carpool/bookings/queries';
import { useQuote, useSeatMap, useTrip } from '@/features/carpool/trips/queries';
import { usePaymentMethods, useValidatePromo } from '@/features/payments/queries';
import { colors, radius, spacing } from '@/theme';
import { useDiscardConfirm } from '@/utils/use-discard-confirm';
import type {
  PaymentMethod,
  PromoValidation,
  SeatPosition,
  Trip,
  TripSeat,
} from '@/types/models';
import { formatMillimes } from '@/utils/money';

const SEAT_LABEL: Record<SeatPosition, string> = {
  front: 'Avant',
  rear_left: 'Arr. gauche',
  rear_middle: 'Arr. centre',
  rear_right: 'Arr. droite',
};

/** Seat choice, fare, promo and payment method — everything before `POST /bookings`. */
export default function BookTripScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const tripQuery = useTrip(tripId);
  const seatMapQuery = useSeatMap(tripId);
  const methodsQuery = usePaymentMethods();

  if (tripQuery.isLoading || methodsQuery.isLoading) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Réserver' }} />
        <LoadingView />
      </Screen>
    );
  }

  if (tripQuery.isError || !tripQuery.data) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Réserver' }} />
        <ErrorView error={tripQuery.error} onRetry={() => void tripQuery.refetch()} />
      </Screen>
    );
  }

  // The seat map and payment methods are both required to book — surface their
  // failure rather than rendering an empty car / no payment options.
  if (seatMapQuery.isError || methodsQuery.isError) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Réserver' }} />
        <ErrorView
          error={seatMapQuery.error ?? methodsQuery.error}
          onRetry={() => {
            void seatMapQuery.refetch();
            void methodsQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <BookingForm
      trip={tripQuery.data}
      seatMap={seatMapQuery.data ?? []}
      methods={methodsQuery.data ?? []}
    />
  );
}

function BookingForm({
  trip,
  seatMap,
  methods,
}: {
  trip: Trip;
  seatMap: TripSeat[];
  methods: PaymentMethod[];
}) {
  const maxSeats = Math.max(1, trip.seats_available);
  const [selected, setSelected] = useState<SeatPosition[]>([]);
  const [methodId, setMethodId] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<PromoValidation | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (methodId === null && methods.length > 0) {
      setMethodId((methods.find((m) => m.is_default) ?? methods[0]!).id);
    }
  }, [methodId, methods]);

  const seats = selected.length;
  const validatePromo = useValidatePromo(trip.id);
  const createBooking = useCreateBooking();

  // Seat choice, promo and payment method are local state — a stray back would
  // drop a validated promo code and the seat selection.
  const discard = useDiscardConfirm((selected.length > 0 || promo !== null) && !createBooking.isSuccess, {
    title: 'Abandonner la réservation ?',
    message: 'Votre sélection de place et votre code promo ne seront pas conservés.',
  });

  const quote = useQuote(
    trip.id,
    { seats, seat_ids: selected, promo_code: promo?.code ?? null },
    seats > 0,
  );

  function toggleSeat(seat: TripSeat) {
    if (seat.state !== 'free') return;
    setSelected((current) => {
      if (current.includes(seat.seat)) return current.filter((s) => s !== seat.seat);
      if (current.length >= maxSeats) return current;
      return [...current, seat.seat];
    });
  }

  async function applyPromo() {
    setPromoError(null);
    const code = promoInput.trim();
    if (!code) return;
    try {
      const result = await validatePromo.mutateAsync({ code, seats: Math.max(1, seats) });
      setPromo(result);
    } catch (error) {
      setPromo(null);
      setPromoError(getFieldError(error, 'promo_code') ?? normalizeError(error).message);
    }
  }

  function clearPromo() {
    setPromo(null);
    setPromoInput('');
    setPromoError(null);
  }

  async function confirm() {
    setFormError(null);
    if (seats === 0 || !methodId) return;
    try {
      const booking = await createBooking.mutateAsync({
        trip_id: trip.id,
        seats,
        seat_ids: selected,
        payment_method_id: methodId,
        promo_code: promo?.code ?? null,
      });
      discard.bypass();
      router.replace(`/carpool/booking/${booking.id}`);
    } catch (error) {
      setFormError(normalizeError(error).message);
    }
  }

  const rearSeats = seatMap.filter((s) => s.seat !== 'front');
  const frontSeat = seatMap.find((s) => s.seat === 'front');
  const ctaLabel = trip.instant_book ? 'Confirmer et payer' : 'Envoyer la demande';

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Votre place' }} />

      <View style={styles.sections}>
        <View style={styles.block}>
          <AppText variant="subheading">Où voulez-vous vous asseoir ?</AppText>
          <AppText variant="bodySmall" color="secondary">
            {maxSeats} place{maxSeats > 1 ? 's' : ''} restante{maxSeats > 1 ? 's' : ''} · touchez pour
            choisir
          </AppText>

          <AppCard style={styles.car}>
            <View style={styles.seatRow}>
              <SeatCell label="Conducteur" state="driver" />
              {frontSeat ? (
                <SeatCell
                  label={SEAT_LABEL.front}
                  state={seatState(frontSeat, selected)}
                  onPress={() => toggleSeat(frontSeat)}
                />
              ) : null}
            </View>
            <View style={styles.seatRow}>
              {rearSeats.map((seat) => (
                <SeatCell
                  key={seat.seat}
                  label={SEAT_LABEL[seat.seat]}
                  state={seatState(seat, selected)}
                  onPress={() => toggleSeat(seat)}
                />
              ))}
            </View>
          </AppCard>
        </View>

        <View style={styles.block}>
          <AppText variant="subheading">Moyen de paiement</AppText>
          {methods.map((method) => (
            <Pressable
              key={method.id}
              onPress={() => setMethodId(method.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: methodId === method.id }}
              accessibilityLabel={method.label}
              style={[styles.methodRow, methodId === method.id && styles.methodRowActive]}
            >
              <View style={styles.methodText}>
                <AppText variant="body">{method.label}</AppText>
                {method.detail ? (
                  <AppText variant="caption" color="tertiary">
                    {method.detail}
                  </AppText>
                ) : null}
              </View>
              <View style={[styles.radio, methodId === method.id && styles.radioOn]} />
            </Pressable>
          ))}
        </View>

        <View style={styles.block}>
          <AppText variant="subheading">Code promo</AppText>
          {promo ? (
            <View style={styles.promoApplied}>
              <AppText variant="bodySmall" color="success">
                {promo.code} · {promo.message}
              </AppText>
              <Pressable onPress={clearPromo} accessibilityRole="button" accessibilityLabel="Retirer le code promo">
                <AppText variant="label" color="brand">
                  Retirer
                </AppText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.promoRow}>
              <View style={styles.promoInput}>
                <AppInput
                  value={promoInput}
                  onChangeText={setPromoInput}
                  placeholder="RAKEB20"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  error={promoError ?? undefined}
                />
              </View>
              <AppButton
                label="Appliquer"
                variant="secondary"
                fullWidth={false}
                loading={validatePromo.isPending}
                onPress={() => void applyPromo()}
              />
            </View>
          )}
        </View>

        <AppCard>
          <FareLine
            label={`Trajet (${seats || 0} place${seats > 1 ? 's' : ''})`}
            value={quote.data ? formatMillimes(quote.data.base) : '—'}
          />
          <FareLine
            label="Frais de service"
            value={quote.data ? formatMillimes(quote.data.service_fee) : '—'}
          />
          {quote.data && quote.data.discount > 0 ? (
            <FareLine
              label={`Réduction ${promo?.code ?? ''}`}
              value={`−${formatMillimes(quote.data.discount)}`}
              tone="success"
            />
          ) : null}
          <View style={styles.divider} />
          <FareLine
            label="Total"
            value={quote.data ? formatMillimes(quote.data.total) : '—'}
            strong
          />
        </AppCard>

        <AppText variant="caption" color="tertiary">
          {trip.cancellation_policy}
        </AppText>

        {formError ? (
          <AppText variant="bodySmall" color="error">
            {formError}
          </AppText>
        ) : quote.isError && seats > 0 ? (
          <AppText variant="bodySmall" color="error">
            Le tarif n’a pas pu être calculé. Vérifiez votre connexion et réessayez.
          </AppText>
        ) : null}

        <AppButton
          label={
            quote.data && seats > 0
              ? `${ctaLabel} · ${formatMillimes(quote.data.total)}`
              : ctaLabel
          }
          disabled={seats === 0 || !methodId || quote.isLoading || quote.isError}
          loading={createBooking.isPending}
          onPress={() => void confirm()}
        />
      </View>
    </Screen>
  );
}

type CellState = 'free' | 'selected' | 'taken' | 'blocked' | 'driver';

function seatState(seat: TripSeat, selected: SeatPosition[]): CellState {
  if (selected.includes(seat.seat)) return 'selected';
  return seat.state;
}

function SeatCell({
  label,
  state,
  onPress,
}: {
  label: string;
  state: CellState;
  onPress?: () => void;
}) {
  const interactive = state === 'free' || state === 'selected';
  const caption =
    state === 'taken'
      ? 'Occupée'
      : state === 'blocked'
        ? 'Indispo.'
        : state === 'driver'
          ? ''
          : state === 'selected'
            ? 'Choisie'
            : 'Libre';

  return (
    <Pressable
      onPress={interactive ? onPress : undefined}
      disabled={!interactive}
      accessibilityRole={interactive ? 'button' : 'image'}
      accessibilityState={{ selected: state === 'selected', disabled: !interactive }}
      accessibilityLabel={`${label}${caption ? `, ${caption}` : ''}`}
      style={[
        styles.seat,
        state === 'selected' && styles.seatSelected,
        state === 'driver' && styles.seatDriver,
        (state === 'taken' || state === 'blocked') && styles.seatDisabled,
      ]}
    >
      <AppText variant="caption" color={state === 'selected' ? 'inverse' : 'secondary'}>
        {label}
      </AppText>
      {caption ? (
        <AppText variant="caption" color={state === 'selected' ? 'inverse' : 'tertiary'}>
          {caption}
        </AppText>
      ) : null}
    </Pressable>
  );
}

function FareLine({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: 'success';
}) {
  return (
    <View style={styles.fareLine}>
      <AppText variant={strong ? 'subheading' : 'bodySmall'} color={strong ? 'primary' : 'secondary'}>
        {label}
      </AppText>
      <AppText
        variant={strong ? 'subheading' : 'bodySmall'}
        color={tone === 'success' ? 'success' : strong ? 'brand' : 'primary'}
      >
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: spacing.xl,
    paddingTop: spacing.md,
  },
  block: {
    gap: spacing.sm,
  },
  car: {
    gap: spacing.md,
  },
  seatRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end',
  },
  seat: {
    flex: 1,
    minHeight: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    padding: spacing.xs,
  },
  seatSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  seatDriver: {
    backgroundColor: colors.background.surface,
    borderStyle: 'dashed',
  },
  seatDisabled: {
    backgroundColor: colors.background.disabled,
    borderColor: colors.border.default,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  methodRowActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primarySurface,
  },
  methodText: {
    flex: 1,
    gap: spacing.xxs,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border.strong,
  },
  radioOn: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primary,
  },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  promoInput: {
    flex: 1,
  },
  promoApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.status.successSurface,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: spacing.sm,
  },
  fareLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxs,
    gap: spacing.md,
  },
});
