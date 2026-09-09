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
import { BookingStatusBadge } from '@/features/carpool/trips/components/TripStatusBadge';
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
  const status = booking.status;
  const inProgress = status === 'in_progress';
  const confirmed = status === 'confirmed';
  const completed = status === 'completed';
  const pending = status === 'pending';
  // Everything else — declined, expired, no_show, cancelled_by_* — is a dead end.
  const terminated = !inProgress && !confirmed && !completed && !pending;
  // Live = the passenger can still track / message / cancel.
  const live = confirmed || inProgress;
  const driverName = booking.trip.driver.first_name;
  const when = `${departure ? formatLongDate(departure) : ''} à ${formatIsoTime(
    booking.trip.departure_at,
  )}`;

  const heading = inProgress
    ? 'Covoiturage en cours'
    : completed
      ? 'Trajet terminé'
      : confirmed
        ? 'C’est confirmé !'
        : pending
          ? 'Demande envoyée'
          : status === 'declined'
            ? 'Demande refusée'
            : status === 'expired'
              ? 'Demande expirée'
              : status === 'no_show'
                ? 'Absence signalée'
                : 'Réservation annulée';
  const sub = inProgress
    ? `Vous voyagez avec ${driverName}. Suivez le trajet en direct.`
    : completed
      ? `Merci d’avoir voyagé avec ${driverName}.`
      : confirmed
        ? `${driverName} vous attend ${when}.`
        : pending
          ? `${driverName} doit accepter votre demande. Vous serez notifié dès sa réponse.`
          : status === 'declined'
            ? `${driverName} n’a pas pu accepter votre demande.`
            : status === 'expired'
              ? 'Le conducteur n’a pas répondu à temps. Aucun montant n’a été débité.'
              : status === 'no_show'
                ? 'Le conducteur a signalé que vous n’étiez pas au point de rendez-vous.'
                : 'Cette réservation n’est plus active.';

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
      <View style={styles.headerBlock}>
        <AppText variant="title">{heading}</AppText>
        <BookingStatusBadge status={status} />
        <AppText variant="body" color="secondary" style={styles.sub}>
          {sub}
        </AppText>
        {pending && booking.expires_at ? (
          <AppText variant="caption" color="tertiary">
            Sans réponse, la demande expire le{' '}
            {formatLongDate(parseIsoDate(booking.expires_at) ?? new Date())}.
          </AppText>
        ) : null}
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
        <Row
          label="Payé"
          value={
            booking.payment_method_label
              ? `${formatMillimes(booking.total_price)} · ${booking.payment_method_label}`
              : formatMillimes(booking.total_price)
          }
        />
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
            onPress={() => router.dismissTo('/(tabs)')}
          />
        </View>
      ) : terminated ? (
        <AppButton
          label="Retour à l’accueil"
          variant="secondary"
          onPress={() => router.dismissTo('/(tabs)')}
        />
      ) : (
        <View style={styles.actions}>
          {live ? (
            <AppButton
              label="Suivre le trajet en direct"
              onPress={() =>
                router.push({
                  pathname: '/carpool/tracking/[tripId]',
                  params: { tripId: booking.trip.id, bookingId: booking.id },
                })
              }
            />
          ) : null}
          {booking.conversation_id ? (
            <AppButton
              label="Contacter le conducteur"
              variant="secondary"
              onPress={() => router.push(`/carpool/conversation/${booking.conversation_id}`)}
            />
          ) : null}
          {live ? (
            <AppButton
              label="Partager mon trajet à un proche"
              variant="secondary"
              loading={share.isPending}
              onPress={() => void onShare()}
            />
          ) : null}

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
  headerBlock: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  sub: {
    marginTop: spacing.xs,
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
