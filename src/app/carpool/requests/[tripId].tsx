import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
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
  useCancelTrip,
  useCompleteTrip,
  useDeclineBooking,
  useMarkNoShow,
  useStartTrip,
} from '@/features/carpool/publishing/queries';
import { useDriverPositionBroadcast } from '@/features/carpool/tracking/use-driver-position-broadcast';
import { TripStatusBadge } from '@/features/carpool/trips/components/TripStatusBadge';
import { useTrip } from '@/features/carpool/trips/queries';
import { colors, radius, sizes, spacing } from '@/theme';
import type { BookingRequest } from '@/types/models';
import { formatLongDate, formatIsoTime, parseIsoDate } from '@/utils/date';
import { formatMillimes } from '@/utils/money';

/** The driver's trip-day console: requests, start, check-in, complete, cancel. */
export default function TripRequestsScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const trip = useTrip(tripId);

  const pending = useBookingRequests(tripId ?? null, 'pending');
  const confirmed = useBookingRequests(tripId ?? null, 'confirmed');
  const boarded = useBookingRequests(tripId ?? null, 'in_progress');
  const pendingRows = flattenPages(pending.data);
  const roster = useMemo(
    () => [...flattenPages(confirmed.data), ...flattenPages(boarded.data)],
    [confirmed.data, boarded.data],
  );

  const start = useStartTrip(tripId ?? '');
  const complete = useCompleteTrip(tripId ?? '');
  const cancel = useCancelTrip(tripId ?? '');
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const status = trip.data?.status;
  const departure = parseIsoDate(trip.data?.departure_at);
  const canStart = status === 'published' || status === 'full';
  const inProgress = status === 'in_progress';
  const finished = status === 'completed' || status === 'cancelled';

  // Stream the driver's position to passengers for the length of the trip.
  const { sharing } = useDriverPositionBroadcast(tripId, inProgress);

  async function onStart() {
    setError(null);
    try {
      const r = await start.mutateAsync(undefined);
      setNote(
        r.total > 0
          ? `Covoiturage démarré. Validez le code de chaque passager (${r.checked_in}/${r.total}).`
          : 'Covoiturage démarré.',
      );
    } catch (e) {
      setError(normalizeError(e).message);
    }
  }

  async function onComplete() {
    setError(null);
    try {
      const r = await complete.mutateAsync();
      setNote(`Trajet terminé · ${formatMillimes(r.driver_credit)} crédités sur votre portefeuille.`);
    } catch (e) {
      setError(normalizeError(e).message);
    }
  }

  async function onCancel() {
    setError(null);
    try {
      await cancel.mutateAsync(cancelReason.trim() || 'Annulé par le conducteur');
      setConfirmCancel(false);
      setNote('Trajet annulé. Les passagers confirmés sont remboursés et prévenus.');
    } catch (e) {
      setError(normalizeError(e).message);
    }
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Mon trajet' }} />

      {trip.isLoading ? (
        <LoadingView />
      ) : trip.isError || !trip.data ? (
        <ErrorView error={trip.error} onRetry={() => void trip.refetch()} />
      ) : (
        <View style={styles.sections}>
          <View style={styles.headerBlock}>
            <AppText variant="title">
              {trip.data.origin.label} → {trip.data.destination.label}
            </AppText>
            <View style={styles.headerMeta}>
              <AppText variant="bodySmall" color="secondary">
                {departure
                  ? `${formatLongDate(departure)} · ${formatIsoTime(trip.data.departure_at)}`
                  : ''}
              </AppText>
              <TripStatusBadge status={trip.data.status} />
            </View>
            <AppText variant="bodySmall" color="secondary">
              {trip.data.seats_available} place{trip.data.seats_available > 1 ? 's' : ''} libre
              {trip.data.seats_available > 1 ? 's' : ''}
            </AppText>
          </View>

          {/* ---- Lifecycle ---- */}
          {!finished ? (
            <AppCard style={styles.block}>
              <AppText variant="subheading">Le jour du trajet</AppText>

              {canStart ? (
                <>
                  <AppText variant="bodySmall" color="secondary">
                    Démarrez le covoiturage au moment du départ. Les passagers seront prévenus.
                  </AppText>
                  <AppButton
                    label="Démarrer le covoiturage"
                    loading={start.isPending}
                    onPress={() => void onStart()}
                  />
                </>
              ) : null}

              {inProgress ? (
                <>
                  <AppText variant="bodySmall" color="success">
                    Covoiturage en cours.
                    {sharing ? ' Votre position est partagée avec les passagers.' : ''}
                  </AppText>
                  <AppButton
                    label="Terminer le trajet"
                    loading={complete.isPending}
                    onPress={() => void onComplete()}
                  />
                </>
              ) : null}

              {confirmCancel ? (
                <View style={styles.cancelBox}>
                  <TextInput
                    value={cancelReason}
                    onChangeText={setCancelReason}
                    placeholder="Motif de l’annulation (optionnel)"
                    placeholderTextColor={colors.text.tertiary}
                    style={styles.reasonInput}
                  />
                  <View style={styles.rowActions}>
                    <AppButton
                      label="Retour"
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
                <Pressable
                  onPress={() => setConfirmCancel(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Annuler le trajet"
                  hitSlop={sizes.hitSlop}
                  style={styles.cancelLink}
                >
                  <AppText variant="label" color="error">
                    Annuler le trajet
                  </AppText>
                </Pressable>
              )}

              {note ? (
                <AppText variant="bodySmall" color="success">
                  {note}
                </AppText>
              ) : null}
              {error ? (
                <AppText variant="bodySmall" color="error">
                  {error}
                </AppText>
              ) : null}
            </AppCard>
          ) : null}

          {/* ---- Pending requests ---- */}
          {!finished ? (
            <View style={styles.block}>
              <AppText variant="subheading">Demandes en attente</AppText>
              {pending.isLoading ? (
                <LoadingView fullscreen={false} />
              ) : pending.isError && pendingRows.length === 0 ? (
                <ErrorView error={pending.error} onRetry={() => void pending.refetch()} />
              ) : pendingRows.length === 0 ? (
                <EmptyView
                  title="Aucune demande"
                  description="Les demandes de réservation apparaîtront ici."
                />
              ) : (
                <FlatList
                  data={pendingRows}
                  scrollEnabled={false}
                  keyExtractor={(item) => item.id}
                  ItemSeparatorComponent={() => <View style={styles.gap} />}
                  renderItem={({ item }) => <RequestRow request={item} />}
                />
              )}
            </View>
          ) : null}

          {/* ---- Confirmed / boarded roster ---- */}
          {roster.length > 0 ? (
            <View style={styles.block}>
              <AppText variant="subheading">Passagers confirmés</AppText>
              {inProgress ? (
                <CheckInField tripId={tripId ?? ''} onNote={setNote} onError={setError} />
              ) : null}
              <FlatList
                data={roster}
                scrollEnabled={false}
                keyExtractor={(item) => item.id}
                ItemSeparatorComponent={() => <View style={styles.gap} />}
                renderItem={({ item }) => (
                  <RosterRow request={item} tripId={tripId ?? ''} canNoShow={inProgress} />
                )}
              />
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function CheckInField({
  tripId,
  onNote,
  onError,
}: {
  tripId: string;
  onNote: (v: string) => void;
  onError: (v: string) => void;
}) {
  const start = useStartTrip(tripId);
  const [code, setCode] = useState('');

  async function onCheckIn() {
    onError('');
    if (code.trim().length !== 4) {
      onError('Le code passager fait 4 chiffres.');
      return;
    }
    try {
      const r = await start.mutateAsync(code.trim());
      setCode('');
      onNote(`Passager validé — ${r.checked_in}/${r.total} montés.`);
    } catch (e) {
      onError(normalizeError(e).message);
    }
  }

  return (
    <View style={styles.checkinRow}>
      <TextInput
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 4))}
        placeholder="Code passager (1234)"
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
  );
}

function RosterRow({
  request,
  tripId,
  canNoShow,
}: {
  request: BookingRequest;
  tripId: string;
  canNoShow: boolean;
}) {
  const noShow = useMarkNoShow(tripId);
  const [error, setError] = useState<string | null>(null);
  const boarded = request.status === 'in_progress';

  async function onNoShow() {
    setError(null);
    try {
      await noShow.mutateAsync(request.id);
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
            {request.seats} place{request.seats > 1 ? 's' : ''} ·{' '}
            {boarded ? 'monté' : request.status === 'no_show' ? 'absent' : 'à valider'}
          </AppText>
        </View>
      </View>
      {error ? (
        <AppText variant="caption" color="error" style={styles.note}>
          {error}
        </AppText>
      ) : null}
      {canNoShow && !boarded && request.status !== 'no_show' ? (
        <View style={styles.rowActions}>
          <AppButton
            label="Pas venu"
            variant="secondary"
            fullWidth={false}
            loading={noShow.isPending}
            onPress={() => void onNoShow()}
          />
        </View>
      ) : null}
    </AppCard>
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
            {request.rider.rating != null
              ? `★ ${request.rider.rating.toFixed(1)} · `
              : 'Nouveau membre · '}
            {request.seats} place{request.seats > 1 ? 's' : ''} ·{' '}
            {formatMillimes(request.total_price, { compact: true })}
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
          <View style={styles.rowActions}>
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
        <View style={styles.rowActions}>
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
  headerBlock: { gap: spacing.xs },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
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
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  declineLink: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
  declineBox: { marginTop: spacing.md, gap: spacing.sm },
  cancelBox: { gap: spacing.sm, marginTop: spacing.xs },
  cancelLink: { paddingVertical: spacing.sm, alignSelf: 'flex-start' },
  reasonInput: {
    height: sizes.input.height,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text.primary,
    fontSize: 16,
  },
  checkinRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  codeInput: {
    flex: 1,
    height: sizes.input.height,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text.primary,
    fontSize: 18,
    letterSpacing: 2,
  },
});
