import { router } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { ChoiceCard, EmptyView, ErrorView, LoadingView } from '@/components';
import { spacing } from '@/theme';
import type { ServiceDefinition } from '@/types/models';

import { useServices } from '../queries';
import { getServiceIcon, getServiceRoute } from '../service-registry';

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
  const { data, isLoading, isError, error, refetch } = useServices();

  // `placeholderData` means there is always a list to render; a failure only
  // matters once it has replaced nothing.
  if (isLoading && !data) {
    return <LoadingView />;
  }

  if (isError && !data) {
    return <ErrorView error={error} onRetry={() => void refetch()} />;
  }

  if (!data || data.length === 0) {
    return <EmptyView icon="apps-outline" title="Aucun service pour le moment" />;
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(service) => service.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <ServiceRow service={item} />}
    />
  );
}

function ServiceRow({ service }: { service: ServiceDefinition }) {
  const route = getServiceRoute(service);

  return (
    <ChoiceCard
      icon={getServiceIcon(service)}
      title={service.name}
      description={service.description}
      subtitle={service.status === 'coming_soon' ? `${service.description} · Bientôt` : undefined}
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
    />
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
});
