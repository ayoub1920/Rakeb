import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { flattenPages } from '@/api/pagination';
import { AppCard, AppInput, AppText, EmptyView, ErrorView, LoadingView, Screen } from '@/components';
import { useAdminUsers } from '@/features/admin/users/queries';
import { colors, radius, spacing } from '@/theme';
import type { UserRole, UserStatus } from '@/types/models';
import { useDebouncedValue } from '@/utils/use-debounced-value';

const ROLE_FILTERS: { value: UserRole | undefined; label: string }[] = [
  { value: undefined, label: 'Tous les rôles' },
  { value: 'rider', label: 'Passager' },
  { value: 'driver', label: 'Conducteur' },
  { value: 'both', label: 'Passager + conducteur' },
  { value: 'admin', label: 'Admin' },
  { value: 'support', label: 'Support' },
];

const STATUS_FILTERS: { value: UserStatus | undefined; label: string }[] = [
  { value: undefined, label: 'Tous les statuts' },
  { value: 'active', label: 'Actif' },
  { value: 'suspended', label: 'Suspendu' },
  { value: 'deleted', label: 'Supprimé' },
];

const STATUS_COLOR: Record<UserStatus, string> = {
  active: colors.status.success,
  suspended: colors.status.warning,
  deleted: colors.status.error,
};

const STATUS_LABEL: Record<UserStatus, string> = {
  active: 'Actif',
  suspended: 'Suspendu',
  deleted: 'Supprimé',
};

/** The admin user directory — search by phone/e-mail/name, filter by role and status. */
export default function AdminUsersScreen() {
  const [term, setTerm] = useState('');
  const debouncedTerm = useDebouncedValue(term, 300);
  const [role, setRole] = useState<UserRole | undefined>(undefined);
  const [status, setStatus] = useState<UserStatus | undefined>(undefined);

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
  } = useAdminUsers({ q: debouncedTerm.trim() || undefined, role, status });
  const rows = flattenPages(data);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Utilisateurs' }} />

      <View style={styles.searchRow}>
        <AppInput
          value={term}
          onChangeText={setTerm}
          placeholder="Rechercher (téléphone, e-mail, nom)"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {ROLE_FILTERS.map((f) => (
          <Chip key={f.label} label={f.label} active={role === f.value} onPress={() => setRole(f.value)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.label}
            label={f.label}
            active={status === f.value}
            onPress={() => setStatus(f.value)}
          />
        ))}
      </ScrollView>

      {isLoading ? (
        <LoadingView />
      ) : isError ? (
        <ErrorView error={error} onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyView title="Aucun utilisateur" description="Aucun compte ne correspond à cette recherche." />
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
          renderItem={({ item }) => (
            <AppCard
              onPress={() => router.push(`/admin/users/${item.id}`)}
              accessibilityLabel={item.display_name}
            >
              <View style={styles.row}>
                <View style={styles.rowText}>
                  <AppText variant="label">{item.display_name}</AppText>
                  <AppText variant="caption" color="tertiary">
                    {item.phone}
                    {item.email ? ` · ${item.email}` : ''} · {item.role}
                  </AppText>
                </View>
                <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[item.status]}1A` }]}>
                  <AppText variant="caption" style={{ color: STATUS_COLOR[item.status] }}>
                    {STATUS_LABEL[item.status]}
                  </AppText>
                </View>
              </View>
            </AppCard>
          )}
        />
      )}
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <AppText variant="label" color={active ? 'inverse' : 'secondary'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchRow: { paddingTop: spacing.md },
  filterRow: { flexDirection: 'row', marginTop: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.background.surface,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.brand.primary,
  },
  list: {
    gap: spacing.sm,
    paddingTop: spacing.md,
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
