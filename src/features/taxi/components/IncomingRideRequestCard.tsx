import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppText } from '@/components';
import { spacing } from '@/theme';
import { formatMillimes } from '@/utils/money';

import type { TaxiRideSummary } from '../types';

/** Driver-side card for one nearby `searching` ride, with a countdown to `expires_at`. */
export function IncomingRideRequestCard({
  ride,
  onAccept,
  accepting,
}: {
  ride: TaxiRideSummary;
  onAccept: () => void;
  accepting: boolean;
}) {
  const secondsLeft = useCountdown(ride.expires_at);
  const expired = secondsLeft <= 0;

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <AppText variant="subheading" style={styles.flex}>
          {ride.pickup_label}
        </AppText>
        <AppText variant="caption" color={expired ? 'error' : 'tertiary'}>
          {expired ? 'Expirée' : `${secondsLeft}s`}
        </AppText>
      </View>
      <AppText variant="bodySmall" color="secondary">
        vers {ride.destination_label}
      </AppText>
      {ride.estimated_price != null ? (
        <AppText variant="body" color="brand">
          {formatMillimes(ride.estimated_price)}
        </AppText>
      ) : null}
      <AppButton
        label="Accepter"
        onPress={onAccept}
        loading={accepting}
        disabled={expired}
        style={styles.button}
      />
    </AppCard>
  );
}

function useCountdown(expiresAt: string): number {
  // The lazy initializer covers the mount case; re-keying this hook on
  // `expiresAt` (every card is keyed by `ride.id`, which changes together
  // with `expiresAt`) means the effect only ever needs to start the ticking
  // interval, never synchronously set state on its own.
  const [seconds, setSeconds] = useState(() => secondsUntil(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => setSeconds(secondsUntil(expiresAt)), 1_000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return seconds;
}

function secondsUntil(iso: string): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000));
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  button: {
    marginTop: spacing.xxs,
  },
});
