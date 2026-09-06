import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { normalizeError } from '@/api/errors';
import {
  AppButton,
  AppCard,
  AppText,
  ErrorView,
  LoadingView,
  Screen,
} from '@/components';
import {
  useBooking,
  useCancelBooking,
  useShareBooking,
} from '@/features/carpool/bookings/queries';
import { colors, radius, spacing } from '@/theme';
import type { BookingDetail } from '@/types/models';
import { formatLongDate, formatIsoTime, parseIsoDate } from '@/utils/date';
import { formatMillimes } from '@/utils/money';

/** Confirmation and ticket — reservation code, passenger code, share and cancel. */
export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isLoading, isError, error, refetch } = useBooking(id);

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Votre réservation' }} />

      {isLoading ? (
        <LoadingView />
      ) : isError || !booking ? (
        <ErrorView error={error} onRetry={() => void refetch()} />
      ) : (
        <Ticket booking={booking} />
      )}
    </Screen>
  );
}

function Ticket({ booking }: { booking: BookingDetail }) {
  const share = useShareBooking(booking.id);
  const cancel = useCancelBooking(booking.id);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const departure = parseIsoDate(booking.trip.departure_at);
  const cancelled = booking.status.startsWith('cancelled');
  const completed = booking.status === 'completed';
  const confirmed = booking.status === 'confirmed' || booking.status === 'in_progress';

  const heading = cancelled
    ? 'Réservation annulée'
    : confirmed
      ? 'C’est confirmé !'
      : 'Demande envoyée';
  const sub = cancelled
    ? 'Cette réservation n’est plus active.'
    : confirmed
      ? `${booking.trip.driver.first_name} vous attend ${
          departure ? formatLongDate(departure) : ''
        } à ${formatIsoTime(booking.trip.departure_at)}.`
      : `${booking.trip.driver.first_name} doit accepter votre demande. Vous serez notifié dès sa réponse.`;

  async function onShare() {
    setActionError(null);
    try {
      const result = await share.mutateAsync();
      setNotice(`Lien de suivi : ${result.share_url}`);
    } catch (error) {
      setActionError(normalizeError(error).message);
    }
  }

  async function onCancel() {
    setActionError(null);
    try {
      const result = await cancel.mutateAsync();
      setConfirmCancel(false);
      setNotice(result.message);
    } catch (error) {
      setActionError(normalizeError(error).message);
    }
  }

  return (
    <View style={styles.sections}>
      <View>
        <AppText variant="title">{heading}</AppText>
        <AppText variant="body" color="secondary" style={styles.sub}>
          {sub}
        </AppText>
      </View>

      <AppCard>
        <Row label="Date" value={departure ? formatLongDate(departure) : '—'} />
        <Row
          label="Départ"
          value={`${formatIsoTime(booking.trip.departure_at)} · ${booking.pickup_label}`}
        />
        <Row label="Arrivée" value={booking.dropoff_label} />
        <Row
          label="Places"
          value={
            booking.seat_labels.length
              ? booking.seat_labels.join(', ')
              : `${booking.seats} place${booking.seats > 1 ? 's' : ''}`
          }
        />
        <Row label="Payé" value={`${formatMillimes(booking.total_price)} · ${booking.payment_method_label}`} />
      </AppCard>

      <AppCard style={styles.codes}>
        <View style={styles.codeBlock}>
          <AppText variant="caption" color="tertiary">
            Code de réservation
          </AppText>
          <AppText variant="title" color="brand">
            {booking.reservation_code}
          </AppText>
        </View>
        <View style={styles.codeDivider} />
        <View style={styles.codeBlock}>
          <AppText variant="caption" color="tertiary">
            Code passager
          </AppText>
          <AppText variant="title">{booking.passenger_code}</AppText>
          <AppText variant="caption" color="tertiary">
            À communiquer au conducteur au départ.
          </AppText>
        </View>
      </AppCard>

      {notice ? (
        <AppText variant="bodySmall" color="secondary">
          {notice}
        </AppText>
      ) : null}
      {actionError ? (
        <AppText variant="bodySmall" color="error">
          {actionError}
        </AppText>
      ) : null}

      {completed ? (
        <View style={styles.actions}>
          <AppButton
            label="Noter le trajet"
            onPress={() => router.push(`/carpool/review/${booking.id}`)}
          />
          <AppButton
            label="Retour à l’accueil"
            variant="secondary"
            onPress={() => router.replace('/(tabs)')}
          />
        </View>
      ) : !cancelled ? (
        <View style={styles.actions}>
          <AppButton
            label="Suivre le trajet en direct"
            onPress={() =>
              router.push({
                pathname: '/carpool/tracking/[tripId]',
                params: { tripId: booking.trip.id, bookingId: booking.id },
              })
            }
          />
          {booking.conversation_id ? (
            <AppButton
              label="Contacter le conducteur"
              variant="secondary"
              onPress={() => router.push(`/carpool/conversation/${booking.conversation_id}`)}
            />
          ) : null}
          <AppButton
            label="Partager mon trajet à un proche"
            variant="secondary"
            loading={share.isPending}
            onPress={() => void onShare()}
          />

          {confirmCancel ? (
            <View style={styles.confirmRow}>
              <AppText variant="bodySmall" color="secondary" style={styles.confirmText}>
                {booking.cancellation_policy}
              </AppText>
              <View style={styles.confirmButtons}>
                <AppButton
                  label="Garder"
                  variant="secondary"
                  fullWidth={false}
                  onPress={() => setConfirmCancel(false)}
                />
                <AppButton
                  label="Confirmer l’annulation"
                  variant="danger"
                  fullWidth={false}
                  loading={cancel.isPending}
                  onPress={() => void onCancel()}
                />
              </View>
            </View>
          ) : (
            <AppButton
              label="Annuler la réservation"
              variant="ghost"
              onPress={() => setConfirmCancel(true)}
            />
          )}
        </View>
      ) : (
        <AppButton label="Retour à l’accueil" variant="secondary" onPress={() => router.replace('/(tabs)')} />
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="bodySmall" color="tertiary">
        {label}
      </AppText>
      <AppText variant="bodySmall" style={styles.rowValue}>
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
  sub: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.xs,
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
  },
  codes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  codeBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  codeDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border.default,
  },
  actions: {
    gap: spacing.md,
  },
  confirmRow: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.error,
  },
  confirmText: {},
  confirmButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
});
