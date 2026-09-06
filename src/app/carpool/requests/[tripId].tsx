import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { normalizeError } from '@/api/errors';
import { flattenPages } from '@/api/pagination';
import {
  AppButton,
  AppCard,
  AppText,
  EmptyView,
  ErrorView,
  LoadingView,
  Screen,
} from '@/components';
import {
  useAcceptBooking,
  useBookingRequests,
  useCompleteTrip,
  useDeclineBooking,
  useStartTrip,
} from '@/features/carpool/publishing/queries';
import { useTrip } from '@/features/carpool/trips/queries';
import { colors, radius, sizes, spacing } from '@/theme';
import type { BookingRequest } from '@/types/models';
import { formatLongDate, formatIsoTime, parseIsoDate } from '@/utils/date';
import { formatMillimes } from '@/utils/money';

/** Booking requests for one trip, plus the start / complete lifecycle. */
export default function TripRequestsScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const trip = useTrip(tripId);
  const requests = useBookingRequests(tripId ?? null, 'pending');
  const rows = flattenPages(requests.data);

  const start = useStartTrip(tripId ?? '');
  const complete = useCompleteTrip(tripId ?? '');
  const [code, setCode] = useState('');
  const [lifecycleNote, setLifecycleNote] = useState<string | null>(null);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);

  const departure = parseIsoDate(trip.data?.departure_at);
  const status = trip.data?.status;
  const canStart = status === 'published' || status === 'full';
  const canComplete = status === 'in_progress';

  async function onCheckIn() {
    setLifecycleError(null);
    const value = code.trim();
    if (value.length !== 4) {
      setLifecycleError('Le code passager fait 4 chiffres.');
      return;
    }
    try {
      const result = await start.mutateAsync(value);
      setCode('');
      setLifecycleNote(`Passager validé — ${result.checked_in}/${result.total}`);
    } catch (error) {
      setLifecycleError(normalizeError(error).message);
    }
  }

  async function onComplete() {
    setLifecycleError(null);
    try {
      const result = await complete.mutateAsync();
      setLifecycleNote(
        `Trajet terminé · ${formatMillimes(result.driver_credit)} crédités sur votre portefeuille.`,
      );
    } catch (error) {
      setLifecycleError(normalizeError(error).message);
    }
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Demandes' }} />

      {trip.isLoading ? (
        <LoadingView />
      ) : trip.isError || !trip.data ? (
        <ErrorView error={trip.error} onRetry={() => void trip.refetch()} />
      ) : (
        <View style={styles.sections}>
          <View>
            <AppText variant="title">
              {trip.data.origin.label} → {trip.data.destination.label}
            </AppText>
            <AppText variant="bodySmall" color="secondary">
              {departure ? `${formatLongDate(departure)} · ${formatIsoTime(trip.data.departure_at)}` : ''}
              {' · '}
              {trip.data.seats_available} place{trip.data.seats_available > 1 ? 's' : ''} libre
              {trip.data.seats_available > 1 ? 's' : ''}
            </AppText>
          </View>

          <View style={styles.block}>
            <AppText variant="subheading">Demandes en attente</AppText>
            {requests.isLoading ? (
              <LoadingView fullscreen={false} />
            ) : requests.isError && rows.length === 0 ? (
              <ErrorView error={requests.error} onRetry={() => void requests.refetch()} />
            ) : rows.length === 0 ? (
              <EmptyView
                title="Aucune demande"
                description="Les demandes de réservation apparaîtront ici."
              />
            ) : (
              <FlatList
                data={rows}
                scrollEnabled={false}
                keyExtractor={(item) => item.id}
                ItemSeparatorComponent={() => <View style={styles.gap} />}
                renderItem={({ item }) => <RequestRow request={item} />}
              />
            )}
          </View>

          {(canStart || canComplete) && trip.data.status !== 'completed' ? (
            <AppCard style={styles.block}>
              <AppText variant="subheading">Le jour du trajet</AppText>
              {canStart ? (
                <>
                  <AppText variant="bodySmall" color="secondary">
                    Demandez son code à 4 chiffres à chaque passager pour le valider.
                  </AppText>
                  <View style={styles.checkinRow}>
                    <TextInput
                      value={code}
                      onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 4))}
                      placeholder="1234"
                      placeholderTextColor={colors.text.tertiary}
                      keyboardType="number-pad"
                      style={styles.codeInput}
                      accessibilityLabel="Code passager"
                    />
                    <AppButton
                      label="Valider"
                      fullWidth={false}
                      loading={start.isPending}
                      onPress={() => void onCheckIn()}
                    />
                  </View>
                </>
              ) : null}
              {canComplete ? (
                <AppButton
                  label="Terminer le trajet"
                  loading={complete.isPending}
                  onPress={() => void onComplete()}
                />
              ) : null}
              {lifecycleNote ? (
                <AppText variant="bodySmall" color="success">
                  {lifecycleNote}
                </AppText>
              ) : null}
              {lifecycleError ? (
                <AppText variant="bodySmall" color="error">
                  {lifecycleError}
                </AppText>
              ) : null}
            </AppCard>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function RequestRow({ request }: { request: BookingRequest }) {
  const accept = useAcceptBooking();
  const decline = useDeclineBooking();
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onAccept() {
    setError(null);
    try {
      await accept.mutateAsync(request.id);
    } catch (e) {
      setError(normalizeError(e).message);
    }
  }

  async function onDecline() {
    setError(null);
    try {
      await decline.mutateAsync({ bookingId: request.id, reason: reason.trim() || 'Indisponible' });
      setConfirmDecline(false);
    } catch (e) {
      setError(normalizeError(e).message);
    }
  }

  return (
    <AppCard>
      <View style={styles.reqTop}>
        <View style={styles.avatar}>
          <AppText variant="subheading" color="inverse">
            {request.rider.display_name.slice(0, 1).toUpperCase()}
          </AppText>
        </View>
        <View style={styles.reqText}>
          <AppText variant="subheading">{request.rider.display_name}</AppText>
          <AppText variant="bodySmall" color="secondary">
            {request.rider.rating != null ? `★ ${request.rider.rating.toFixed(1)} · ` : 'Nouveau membre · '}
            {request.seats} place{request.seats > 1 ? 's' : ''} · {formatMillimes(request.total_price, { compact: true })}
          </AppText>
        </View>
      </View>

      {request.note ? (
        <AppText variant="bodySmall" color="secondary" style={styles.note}>
          « {request.note} »
        </AppText>
      ) : null}

      {error ? (
        <AppText variant="caption" color="error" style={styles.note}>
          {error}
        </AppText>
      ) : null}

      {confirmDecline ? (
        <View style={styles.declineBox}>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Motif (optionnel)"
            placeholderTextColor={colors.text.tertiary}
            style={styles.reasonInput}
          />
          <View style={styles.reqActions}>
            <AppButton
              label="Retour"
              variant="secondary"
              fullWidth={false}
              onPress={() => setConfirmDecline(false)}
            />
            <AppButton
              label="Confirmer le refus"
              variant="danger"
              fullWidth={false}
              loading={decline.isPending}
              onPress={() => void onDecline()}
            />
          </View>
        </View>
      ) : (
        <View style={styles.reqActions}>
          <Pressable
            onPress={() => setConfirmDecline(true)}
            accessibilityRole="button"
            accessibilityLabel="Refuser la demande"
            hitSlop={sizes.hitSlop}
            style={styles.declineLink}
          >
            <AppText variant="label" color="tertiary">
              Refuser
            </AppText>
          </Pressable>
          <AppButton
            label="Accepter"
            fullWidth={false}
            loading={accept.isPending}
            onPress={() => void onAccept()}
          />
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing.xl, paddingTop: spacing.md },
  block: { gap: spacing.sm },
  gap: { height: spacing.md },
  reqTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reqText: { flex: 1, gap: spacing.xxs },
  note: { marginTop: spacing.sm },
  reqActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  declineLink: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
  declineBox: { marginTop: spacing.md, gap: spacing.sm },
  reasonInput: {
    height: sizes.input.height,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text.primary,
    fontSize: 16,
  },
  checkinRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: spacing.xs },
  codeInput: {
    flex: 1,
    height: sizes.input.height,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text.primary,
    fontSize: 18,
    letterSpacing: 4,
  },
});
