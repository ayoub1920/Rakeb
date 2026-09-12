import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { AppButton, AppText, Screen } from '@/components';
import { useReverseGeocode } from '@/features/places/queries';
import { locationService } from '@/services/location/location-service';
import { RakebMapView } from '@/services/maps/MapView';
import type { MapRegion } from '@/services/maps/types';
import { usePublishDraftStore } from '@/stores/publish-draft-store';
import { useTaxiRideStore } from '@/stores/taxi-ride-store';
import { DEFAULT_MAP_REGION } from '@/config/constants';
import { colors, radius, spacing } from '@/theme';
import { createLogger } from '@/utils/logger';

type PlaceField = 'origin' | 'destination' | 'stop' | 'pickup';
type PlaceTarget = 'publish' | 'taxi';

const log = createLogger('pick-on-map');

/**
 * "Choisir sur la carte" — drop a pin for a route point.
 *
 * The centre of the map is the pin: the user pans the map under a fixed
 * crosshair, then confirms. `GET /geocode/reverse` turns the centre coordinate
 * into a labelled `Place`. `target` says which store it's written to
 * (`publish` by default) — the driver publish wizard and taxi search both
 * open this, since `/trips/search` keys on real place ids but taxi's
 * `POST /taxi/rides` takes a raw coordinate, so an ad-hoc pin works for both.
 */
export default function PickOnMapModal() {
  const { field = 'origin', target = 'publish' } = useLocalSearchParams<{
    field?: PlaceField;
    target?: PlaceTarget;
  }>();

  const setOrigin = usePublishDraftStore((s) => s.setOrigin);
  const setDestination = usePublishDraftStore((s) => s.setDestination);
  const addStop = usePublishDraftStore((s) => s.addStop);
  const taxiSetPickup = useTaxiRideStore((s) => s.setPickup);
  const taxiSetDestination = useTaxiRideStore((s) => s.setDestination);

  const reverse = useReverseGeocode();
  const [region, setRegion] = useState<MapRegion | undefined>(undefined);
  const [locating, setLocating] = useState(true);
  const centerRef = useRef<{ latitude: number; longitude: number }>({
    latitude: DEFAULT_MAP_REGION.latitude,
    longitude: DEFAULT_MAP_REGION.longitude,
  });

  // Centre on the user's last position when the picker opens, without prompting.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await locationService.getPermissionStatus();
        const position =
          status === 'granted' ? await locationService.getLastKnownPosition() : null;
        if (!cancelled && position) {
          centerRef.current = { latitude: position.lat, longitude: position.lng };
          setRegion({
            latitude: position.lat,
            longitude: position.lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        }
      } catch (error) {
        log.warn('Failed to centre on the last known position', error);
      } finally {
        if (!cancelled) setLocating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const title =
    field === 'origin' || field === 'pickup'
      ? field === 'pickup'
        ? 'Point de prise en charge'
        : 'Point de départ'
      : field === 'stop'
        ? 'Étape'
        : 'Destination';

  async function locateMe() {
    setLocating(true);
    try {
      const permission = await locationService.requestPermission();
      if (permission !== 'granted') return;
      const position =
        (await locationService.getCurrentPosition()) ??
        (await locationService.getLastKnownPosition());
      if (position) {
        centerRef.current = { latitude: position.lat, longitude: position.lng };
        setRegion({
          latitude: position.lat,
          longitude: position.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      log.warn('Failed to resolve the current position', error);
    } finally {
      setLocating(false);
    }
  }

  async function confirm() {
    const center = centerRef.current;
    try {
      const place = await reverse.mutateAsync({ lat: center.latitude, lng: center.longitude });
      if (target === 'taxi') {
        if (field === 'pickup') taxiSetPickup(place);
        else taxiSetDestination(place);
      } else if (field === 'origin') {
        setOrigin(place);
      } else if (field === 'stop') {
        addStop(place);
      } else {
        setDestination(place);
      }
      // This picker is pushed on top of the `select-place` modal; a bare
      // `back()` would land there rather than on the screen that opened the
      // chain. Close every modal so the user is returned to
      // `/carpool/publish/route` or `/taxi/passenger/search`.
      if (router.canDismiss()) router.dismissAll();
      else router.back();
    } catch (error) {
      log.warn('Reverse geocoding failed', error);
    }
  }

  return (
    <Screen padded={false}>
      <Stack.Screen options={{ title: `${title} — sur la carte` }} />

      <View style={styles.mapWrap}>
        <RakebMapView
          style={styles.map}
          region={region}
          showsUserLocation
          onRegionChangeComplete={(next) => {
            centerRef.current = { latitude: next.latitude, longitude: next.longitude };
          }}
        />
        <View pointerEvents="none" style={styles.pinContainer}>
          <View style={styles.pin} />
          <View style={styles.pinStem} />
        </View>
      </View>

      <View style={styles.panel}>
        <AppText variant="bodySmall" color="secondary">
          Déplacez la carte pour placer le repère sur {title.toLowerCase()}.
        </AppText>
        <AppButton
          label={locating ? 'Localisation…' : 'Utiliser ma position'}
          variant="secondary"
          onPress={() => void locateMe()}
          disabled={locating}
        />
        {reverse.isError ? (
          <AppText variant="caption" color="tertiary">
            Impossible de nommer ce point. Réessayez ou choisissez une ville.
          </AppText>
        ) : null}
        <AppButton
          label="Confirmer ce point"
          onPress={() => void confirm()}
          loading={reverse.isPending}
        />
      </View>

      {locating && !region ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={colors.brand.primary} />
        </View>
      ) : null}
    </Screen>
  );
}

const PIN_SIZE = 18;

const styles = StyleSheet.create({
  mapWrap: {
    flex: 1,
  },
  map: {
    flex: 1,
    borderRadius: 0,
  },
  pinContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    backgroundColor: colors.brand.primary,
    borderWidth: 3,
    borderColor: colors.text.inverse,
    // The stem points down, so lift the dot by roughly the stem height.
    marginBottom: 12,
  },
  pinStem: {
    position: 'absolute',
    width: 2,
    height: 14,
    backgroundColor: colors.brand.primary,
    top: '50%',
  },
  panel: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.background.default,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    ...(Platform.OS === 'ios' ? { paddingBottom: spacing.xl } : null),
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.surface,
    borderRadius: radius.md,
  },
});
