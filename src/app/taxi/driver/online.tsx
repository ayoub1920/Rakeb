import { Ionicons } from '@expo/vector-icons';
import { Redirect, Stack, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppText, EmptyView, ErrorView, LoadingView, Screen } from '@/components';
import { IncomingRideRequestCard } from '@/features/taxi/components/IncomingRideRequestCard';
import {
  useAcceptTaxiRide,
  useAvailableTaxiRides,
  useSetTaxiAvailability,
  useTaxiApplication,
} from '@/features/taxi/queries';
import { useTaxiBroadcastStatus } from '@/features/taxi/use-taxi-driver-broadcast';
import { colors, radius, spacing } from '@/theme';

/**
 * Driver dispatch screen: online toggle + incoming request queue. Gated on
 * an approved application — the backend enforces this too
 * (`assertCanDriveTaxi`), this redirect is UX only.
 *
 * The toggle is a real button, not a silent switch: it always shows a
 * loading state while the request is in flight, and any failure — including
 * a denied location permission — is shown inline, never swallowed. See
 * `use-taxi-driver-broadcast.ts` for the location uplink this screen reads
 * (mounted once at `driver/_layout.tsx`, shared here through
 * `useTaxiBroadcastStatus`).
 */
export default function TaxiDriverOnlineScreen() {
  const { data: application, isLoading, isError, error, refetch } = useTaxiApplication();
  const setAvailability = useSetTaxiAvailability();
  const broadcast = useTaxiBroadcastStatus();
  const isOnline = application?.status === 'approved' && !!application.is_online;
  const availableRides = useAvailableTaxiRides(isOnline);
  const accept = useAcceptTaxiRide();

  if (isLoading) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'En service' }} />
        <LoadingView />
      </Screen>
    );
  }

  if (isError || !application) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'En service' }} />
        <ErrorView error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  if (application.status !== 'approved') {
    return <Redirect href="/taxi/driver/status" />;
  }

  async function handleAccept(rideId: string) {
    try {
      const ride = await accept.mutateAsync(rideId);
      router.push({ pathname: '/taxi/driver/ride/[id]', params: { id: ride.id } });
    } catch {
      // Surfaced via the mutation's own error state below; a lost race
      // ("déjà pris") is an expected outcome, not a crash.
    }
  }

  // The very first seconds after going online: the availability flag is
  // already `true` server-side, but the location uplink hasn't landed its
  // first fix yet, so `/rides/available` refuses with `TAXI_LOCATION_UNKNOWN`.
  // That's an expected transient, not a failure — show a calm waiting state
  // instead of a scary error box.
  const waitingForFix = availableRides.error?.code === 'TAXI_LOCATION_UNKNOWN';

  return (
    <Screen scrollable padded={false}>
      <Stack.Screen options={{ title: 'En service' }} />

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
          <View style={styles.toggleText}>
            <AppText variant="subheading">{isOnline ? 'Vous êtes en ligne' : 'Vous êtes hors ligne'}</AppText>
            <AppText variant="caption" color="tertiary">
              {isOnline
                ? 'Visible par les passagers à proximité — vous recevrez les demandes de course ici.'
                : 'Passez en ligne pour être visible et recevoir des courses.'}
            </AppText>
          </View>
        </View>

        <AppButton
          label={isOnline ? 'Passer hors ligne' : 'Passer en ligne'}
          variant={isOnline ? 'secondary' : 'primary'}
          loading={setAvailability.isPending}
          onPress={() => setAvailability.mutate(!isOnline)}
          style={styles.toggleButton}
          testID="taxi-driver-availability-toggle"
        />

        {isOnline && broadcast.permissionDenied ? (
          <View style={styles.warningBanner}>
            <View style={styles.warningRow}>
              <Ionicons name="warning-outline" size={18} color={colors.status.warning} />
              <AppText variant="bodySmall" color="secondary" style={styles.warningText}>
                Localisation refusée : activez-la dans les réglages de l’appareil pour recevoir des
                courses. Vous restez en ligne mais invisible tant qu’elle est désactivée.
              </AppText>
            </View>
            <AppButton
              label="Réessayer"
              variant="secondary"
              fullWidth={false}
              onPress={broadcast.retryPermission}
            />
          </View>
        ) : null}
      </View>

      {setAvailability.isError ? (
        <View style={styles.section}>
          <ErrorView error={setAvailability.error} onRetry={() => setAvailability.mutate(!isOnline)} />
        </View>
      ) : null}

      {accept.isError ? (
        <View style={styles.section}>
          <AppText variant="bodySmall" color="error">
            Cette course n’est plus disponible — elle a probablement été acceptée par un autre chauffeur.
          </AppText>
        </View>
      ) : null}

      {!isOnline ? null : waitingForFix ? (
        <View style={styles.section}>
          <LoadingView label="En attente de votre position…" />
        </View>
      ) : availableRides.isLoading ? (
        <View style={styles.section}>
          <LoadingView label="Recherche de courses…" />
        </View>
      ) : availableRides.isError ? (
        <View style={styles.section}>
          <ErrorView error={availableRides.error} onRetry={() => void availableRides.refetch()} />
        </View>
      ) : !availableRides.data || availableRides.data.length === 0 ? (
        <View style={styles.section}>
          <EmptyView
            title="Aucune demande pour le moment"
            description="Restez en ligne — vous serez notifié dès qu’une course sera disponible."
          />
        </View>
      ) : (
        <View style={styles.list}>
          {availableRides.data.map((ride) => (
            <IncomingRideRequestCard
              key={ride.id}
              ride={ride}
              onAccept={() => void handleAccept(ride.id)}
              accepting={accept.isPending}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotOnline: {
    backgroundColor: colors.status.success,
  },
  statusDotOffline: {
    backgroundColor: colors.text.tertiary,
  },
  toggleText: {
    flex: 1,
    gap: spacing.xxs,
  },
  toggleButton: {
    marginTop: spacing.xs,
  },
  warningBanner: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.status.warningSurface,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
});
