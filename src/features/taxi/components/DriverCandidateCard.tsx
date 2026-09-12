import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components';
import { colors, radius, spacing } from '@/theme';

import type { NearbyTaxiDriver } from '../types';

/** Row for one nearby driver on the passenger quote screen. */
export function DriverCandidateCard({ driver }: { driver: NearbyTaxiDriver }) {
  const minutesAway = Math.max(1, Math.round(driver.distance_m / 400));

  return (
    <View style={styles.row}>
      {driver.photo_url ? (
        <Image source={{ uri: driver.photo_url }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <AppText variant="label" color="secondary">
            {driver.display_name.charAt(0).toUpperCase()}
          </AppText>
        </View>
      )}
      <View style={styles.text}>
        <AppText variant="body">{driver.display_name}</AppText>
        <AppText variant="caption" color="tertiary">
          {driver.plate_number} · à {minutesAway} min
        </AppText>
      </View>
    </View>
  );
}

const AVATAR_SIZE = 40;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    borderRadius: radius.pill,
  },
  text: {
    gap: spacing.xxs,
  },
});
