import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { flattenPages } from '@/api/pagination';
import { AppCard, AppText, EmptyView, ErrorView, LoadingView, Screen } from '@/components';
import { useLicenceVerifications } from '@/features/admin/licences/queries';
import { useLocale } from '@/localization/use-locale';
import { colors, radius, spacing } from '@/theme';
import type { LicenceReviewStatus } from '@/types/models';
import { formatDateTime, parseIsoDate } from '@/utils/date';

const FILTERS: { value: LicenceReviewStatus | undefined; label: string }[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvés' },
  { value: 'rejected', label: 'Refusés' },
];

const STATUS_LABEL: Record<LicenceReviewStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Refusé',
};

const STATUS_COLOR: Record<LicenceReviewStatus, string> = {
  pending: colors.status.warning,
  approved: colors.status.success,
  rejected: colors.status.error,
};

/** The admin queue — every submitted driver's licence, filterable by status. */
export default function AdminLicenceQueueScreen() {
  const [filter, setFilter] = useState<LicenceReviewStatus | undefined>('pending');
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
  } = useLicenceVerifications(filter);
  const { locale } = useLocale();
  const rows = flattenPages(data);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Vérifications permis' }} />

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
          title="Aucune demande"
          description="Aucune vérification de permis dans cette catégorie."
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
                onPress={() => router.push(`/admin/licences/${item.user.id}`)}
                accessibilityLabel={`Vérification de ${item.user.display_name}`}
              >
                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <AppText variant="label">{item.user.display_name}</AppText>
                    <AppText variant="caption" color="tertiary">
                      {item.user.phone}
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
