import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppText, EmptyView, ErrorView, LoadingView, Screen } from '@/components';
import {
  useAdminSupportChats,
  useAdminSupportLive,
} from '@/features/admin/support-chat/queries';
import type { SupportChatStatus } from '@/features/support/chat-api';
import { colors, radius, spacing } from '@/theme';
import { formatRelative, parseIsoDate } from '@/utils/date';

const FILTERS: { key: SupportChatStatus | undefined; label: string }[] = [
  { key: undefined, label: 'Toutes' },
  { key: 'open', label: 'Nouvelles' },
  { key: 'active', label: 'En cours' },
  { key: 'resolved', label: 'Résolues' },
];

/** Staff queue of live support conversations. */
export default function AdminSupportChatsScreen() {
  const [filter, setFilter] = useState<SupportChatStatus | undefined>(undefined);
  const query = useAdminSupportChats(filter);
  useAdminSupportLive();

  const rows = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Screen padded={false}>
      <Stack.Screen options={{ title: 'Chat support' }} />

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.label}
            onPress={() => setFilter(f.key)}
            style={[styles.chip, filter === f.key && styles.chipActive]}
          >
            <AppText variant="caption" color={filter === f.key ? 'inverse' : 'secondary'}>
              {f.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      {query.isLoading ? (
        <LoadingView />
      ) : query.isError && rows.length === 0 ? (
        <ErrorView error={query.error} onRetry={() => void query.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyView title="Aucune conversation" description="La file est vide pour ce filtre." />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          renderItem={({ item }) => {
            const at = parseIsoDate(item.last_message_at ?? item.created_at);
            return (
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/admin/support/${item.id}`)}
              >
                <View style={styles.cardTop}>
                  <AppText variant="subheading">{item.user_name}</AppText>
                  <AppText variant="caption" color="tertiary">
                    {at ? formatRelative(at) : ''}
                  </AppText>
                </View>
                <AppText variant="bodySmall" color="secondary" numberOfLines={1}>
                  {item.last_message?.body ?? 'Nouvelle conversation'}
                </AppText>
                <View style={styles.cardBottom}>
                  <StatusPill status={item.status} />
                  {item.unread_count > 0 ? (
                    <View style={styles.unread}>
                      <AppText variant="caption" color="inverse">
                        {item.unread_count} non lu{item.unread_count > 1 ? 's' : ''}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

function StatusPill({ status }: { status: SupportChatStatus }) {
  const label = status === 'open' ? 'Nouvelle' : status === 'active' ? 'En cours' : 'Résolue';
  const tint =
    status === 'open'
      ? colors.status.warning
      : status === 'active'
        ? colors.brand.primary
        : colors.text.tertiary;
  return (
    <View style={[styles.pill, { borderColor: tint }]}>
      <AppText variant="caption" style={{ color: tint }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.background.surface,
  },
  chipActive: { backgroundColor: colors.brand.primary },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.background.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  unread: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.accent,
  },
});
