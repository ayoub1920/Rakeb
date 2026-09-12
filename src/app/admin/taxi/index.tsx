import { Stack, router } from 'expo-router';
import type { Href } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { flattenPages } from '@/api/pagination';
import { AppCard, AppText, EmptyView, ErrorView, LoadingView, Screen } from '@/components';
import { useAdminTaxiApplications } from '@/features/admin/taxi/queries';
import type { TaxiApplicationStatus } from '@/features/taxi/types';
import { useLocale } from '@/localization/use-locale';
import { colors, radius, spacing } from '@/theme';
import { formatDateTime, parseIsoDate } from '@/utils/date';

const FILTERS: { value: TaxiApplicationStatus | undefined; label: string }[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvées' },
  { value: 'rejected', label: 'Refusées' },
];

const STATUS_LABEL: Record<TaxiApplicationStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Refusée',
};

const STATUS_COLOR: Record<TaxiApplicationStatus, string> = {
  pending: colors.status.warning,
  approved: colors.status.success,
  rejected: colors.status.error,
};

/** Admin queue — every taxi driver application, filterable by status. */
export default function AdminTaxiQueueScreen() {
  const [filter, setFilter] = useState<TaxiApplicationStatus | undefined>('pending');
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdminTaxiApplications(filter);
  const { locale } = useLocale();
  const rows = flattenPages(data);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Chauffeurs taxi' }} />

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.label}
            onPress={() => setFilter(f.value)}
            accessibilityRole="button"
            accessibilityLabel={f.label}
            accessibilityState={{ selected: filter === f.value }}
            style={[styles.chip, filter === f.value && styles.chipActive]}
          >
            <AppText variant="label" color={filter === f.value ? 'inverse' : 'secondary'}>
              {f.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <LoadingView />
      ) : isError ? (
        <ErrorView error={error} onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyView
          title="Aucune candidature"
          description="Aucune candidature chauffeur taxi dans cette catégorie."
        />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          refreshing={isFetching && !isFetchingNextPage}
          onRefresh={() => void refetch()}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const submitted = parseIsoDate(item.submitted_at);
            return (
              <AppCard
                onPress={() => router.push(`/admin/taxi/${item.user_id}` as Href)}
                accessibilityLabel={`Candidature de ${item.display_name}`}
              >
                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <AppText variant="label">{item.display_name}</AppText>
                    <AppText variant="caption" color="tertiary">
                      {item.plate_number}
                      {submitted ? ` · ${formatDateTime(submitted, locale)}` : ''}
                    </AppText>
                  </View>
                  <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[item.status]}1A` }]}>
                    <AppText variant="caption" style={{ color: STATUS_COLOR[item.status] }}>
                      {STATUS_LABEL[item.status]}
                    </AppText>
                  </View>
                </View>
              </AppCard>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.background.surface,
  },
  chipActive: {
    backgroundColor: colors.brand.primary,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: spacing.xxs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
});
