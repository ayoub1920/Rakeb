import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppCard, AppText, ErrorView } from '@/components';
import { spacing } from '@/theme';
import type { ServiceDefinition } from '@/types/models';

import { useServices } from '../queries';
import { getServiceRoute } from '../service-registry';

/**
 * The service catalogue.
 *
 * The one piece of real UI in the scaffold, because the catalogue is what makes
 * Rakeb a multi-service product: it is the mechanism by which taxi, food and
 * grocery arrive later without touching carpool.
 *
 * A live service navigates to its entry route; anything else opens the
 * coming-soon modal.
 */
export function ServiceList() {
  const { data, isError, error, refetch } = useServices();

  // `placeholderData` means there is always a list to render; a failure only
  // matters once it has replaced nothing.
  if (isError && !data) {
    return <ErrorView error={error} onRetry={() => void refetch()} />;
  }

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(service) => service.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <ServiceRow service={item} />}
    />
  );
}

function ServiceRow({ service }: { service: ServiceDefinition }) {
  const route = getServiceRoute(service);

  return (
    <AppCard
      accessibilityLabel={`${service.name}${route ? '' : ', bientôt disponible'}`}
      onPress={() => {
        if (route) {
          router.push(route);
          return;
        }
        router.push({
          pathname: '/(modals)/coming-soon',
          params: { serviceName: service.name },
        });
      }}
    >
      <View style={styles.row}>
        <View style={styles.text}>
          <AppText variant="subheading">{service.name}</AppText>
          <AppText variant="bodySmall" color="secondary">
            {service.description}
          </AppText>
        </View>

        {service.status === 'coming_soon' ? (
          <AppText variant="caption" color="tertiary">
            Bientôt
          </AppText>
        ) : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
});
