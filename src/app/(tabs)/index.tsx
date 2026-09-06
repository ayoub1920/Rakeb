import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useCurrentUser } from '@/features/profile/queries';
import { useNearbyTrips } from '@/features/carpool/search/queries';
import { useNearbyLocation } from '@/features/carpool/search/use-nearby-location';
import { TripSummaryCard } from '@/features/carpool/trips/components/TripSummaryCard';
import { PromoBannerStrip } from '@/features/payments/components/PromoBannerStrip';
import { useServices } from '@/features/services/queries';
import { getServiceRoute } from '@/features/services/service-registry';
import {
  AppButton,
  AppCard,
  AppText,
  EmptyView,
  ErrorView,
  LoadingView,
  Screen,
  ScreenHeader,
} from '@/components';
import { colors, radius, spacing } from '@/theme';
import type { ServiceDefinition } from '@/types/models';

const NEARBY_PREVIEW_COUNT = 3;

/** Accueil — the app's landing screen and the redirect target after sign-in. */
export default function HomeScreen() {
  const { data: user } = useCurrentUser();

  const greeting = user ? `Bonjour, ${user.display_name}` : 'Bonjour';

  return (
    <Screen scrollable edges={['top', 'bottom']}>
      <ScreenHeader title={greeting} subtitle="Où allez-vous aujourd’hui ?" />

      <View style={styles.sections}>
        <SearchEntry />
        <PromoBannerStrip />
        <NearbySection />
        <ServiceShortcuts />
      </View>
    </Screen>
  );
}

function SearchEntry() {
  const { t } = useTranslation();

  return (
    <View style={styles.block}>
      <AppCard
        onPress={() => router.push('/carpool/search')}
        accessibilityLabel="Rechercher un trajet"
      >
        <AppText variant="caption" color="tertiary">
          {t('common.search')}
        </AppText>
        <AppText variant="subheading">Où allez-vous ?</AppText>
        <AppText variant="bodySmall" color="secondary">
          Départ, arrivée, date et places
        </AppText>
      </AppCard>

      <AppButton
        label="Publier un trajet"
        variant="secondary"
        onPress={() => router.push('/carpool/publish')}
      />
    </View>
  );
}

function NearbySection() {
  const { state, coords, enable } = useNearbyLocation();
  const { data, isLoading, isError, error, refetch } = useNearbyTrips(coords);

  return (
    <View style={styles.block}>
      <AppText variant="subheading">Trajets près de vous</AppText>

      {state === 'idle' ? (
        <AppButton
          label="Voir les trajets près de moi"
          variant="secondary"
          onPress={() => void enable()}
        />
      ) : null}

      {state === 'locating' ? <LoadingView label="Localisation…" fullscreen={false} /> : null}

      {state === 'denied' ? (
        <AppText variant="bodySmall" color="secondary">
          Autorisez la localisation pour voir les trajets proches, ou lancez une recherche.
        </AppText>
      ) : null}

      {state === 'unavailable' ? (
        <AppText variant="bodySmall" color="secondary">
          Position indisponible pour le moment. Réessayez plus tard.
        </AppText>
      ) : null}

      {state === 'ready' ? (
        isLoading ? (
          <LoadingView fullscreen={false} />
        ) : isError ? (
          <ErrorView error={error} onRetry={() => void refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyView
            title="Aucun trajet à proximité"
            description="Essayez une recherche par ville."
            actionLabel="Rechercher"
            onAction={() => router.push('/carpool/search')}
          />
        ) : (
          <View style={styles.tripList}>
            {data.slice(0, NEARBY_PREVIEW_COUNT).map((trip) => (
              <TripSummaryCard key={trip.id} trip={trip} />
            ))}
            {data.length > NEARBY_PREVIEW_COUNT ? (
              <AppButton
                label="Tout voir"
                variant="ghost"
                onPress={() => router.push('/carpool/results')}
              />
            ) : null}
          </View>
        )
      ) : null}
    </View>
  );
}

function ServiceShortcuts() {
  const { data } = useServices();

  if (!data || data.length === 0) return null;

  return (
    <View style={styles.block}>
      <AppText variant="subheading">Services</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shortcutTrack}
      >
        {data.map((service) => (
          <ServiceChip key={service.id} service={service} />
        ))}
      </ScrollView>
    </View>
  );
}

function ServiceChip({ service }: { service: ServiceDefinition }) {
  const route = getServiceRoute(service);

  return (
    <Pressable
      style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${service.name}${route ? '' : ', bientôt disponible'}`}
      onPress={() => {
        if (route) {
          router.push(route);
          return;
        }
        router.push({ pathname: '/(modals)/coming-soon', params: { serviceName: service.name } });
      }}
    >
      <AppText variant="label">{service.name}</AppText>
      <AppText variant="caption" color="tertiary">
        {route ? 'Disponible' : 'Bientôt'}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: spacing.xl,
    paddingTop: spacing.md,
  },
  block: {
    gap: spacing.md,
  },
  tripList: {
    gap: spacing.md,
  },
  shortcutTrack: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  chip: {
    minWidth: 132,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surfaceRaised,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xxs,
  },
  chipPressed: {
    opacity: 0.9,
  },
});
