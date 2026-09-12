import { Image } from 'expo-image';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, AppCard, AppText } from '@/components';
import { colors, radius, spacing } from '@/theme';

import { TaxiRideProgress } from './TaxiRideProgress';
import { TaxiRideStatusBadge } from './TaxiRideStatusBadge';
import type { TaxiRide } from '../types';

/** Post-acceptance bottom sheet on the passenger ride screen: driver card, progress, cancel. */
export function ActiveRideSheet({
  ride,
  onCancel,
  cancelLoading,
}: {
  ride: TaxiRide;
  onCancel: () => void;
  cancelLoading: boolean;
}) {
  const insets = useSafeAreaInsets();
  const canCancel = ride.status !== 'trip_completed' && ride.status !== 'cancelled' && ride.status !== 'expired';

  return (
    <View
      style={[
        styles.panel,
        { paddingBottom: Math.max(insets.bottom, spacing.md) },
        Platform.OS === 'ios' ? styles.iosPadding : null,
      ]}
    >
      <TaxiRideStatusBadge status={ride.status} />

      {ride.driver ? (
        <AppCard style={styles.driverCard}>
          <View style={styles.driverRow}>
            {ride.driver.avatar_url ? (
              <Image source={{ uri: ride.driver.avatar_url }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <AppText variant="subheading" color="secondary">
                  {ride.driver.display_name.charAt(0).toUpperCase()}
                </AppText>
              </View>
            )}
            <View style={styles.driverText}>
              <AppText variant="body">{ride.driver.display_name}</AppText>
              <AppText variant="caption" color="tertiary">
                {ride.driver.plate_number}
                {ride.driver.rating != null ? ` · ★ ${ride.driver.rating.toFixed(1)}` : ''}
              </AppText>
            </View>
          </View>
        </AppCard>
      ) : null}

      {ride.status !== 'searching' ? (
        <View style={styles.progress}>
          <TaxiRideProgress status={ride.status} />
        </View>
      ) : (
        <AppText variant="bodySmall" color="tertiary" align="center">
          Recherche d’un chauffeur à proximité…
        </AppText>
      )}

      <AppButton
        label="Ouvrir dans Maps"
        variant="secondary"
        onPress={() =>
          Linking.openURL(`https://maps.google.com/?q=${ride.destination.lat},${ride.destination.lng}`)
        }
      />

      {canCancel ? (
        <AppButton
          label="Annuler la course"
          variant="danger"
          onPress={onCancel}
          loading={cancelLoading}
          style={styles.cancelButton}
        />
      ) : null}
    </View>
  );
}

const AVATAR_SIZE = 48;

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
  driverCard: {
    padding: spacing.md,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    backgroundColor: colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverText: {
    gap: spacing.xxs,
  },
  progress: {
    paddingVertical: spacing.xs,
  },
  cancelButton: {
    marginTop: spacing.xxs,
  },
});
