import { Stack, router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { flattenPages } from '@/api/pagination';
import { AppText, EmptyView, ErrorView, LoadingView, Screen } from '@/components';
import { notificationRoute } from '@/features/notifications/api';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/queries';
import { colors, radius, spacing } from '@/theme';
import type { Notification } from '@/types/models';
import { formatRelative, parseIsoDate } from '@/utils/date';

/** The in-app notification feed. Rows deep-link to the booking / conversation / trip. */
export default function NotificationsScreen() {
  const { t } = useTranslation();
  const query = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const notifications = flattenPages(query.data);
  const hasUnread = notifications.some((n) => !n.read_at);

  function open(notification: Notification) {
    if (!notification.read_at) markRead.mutate(notification.id);
    const route: Href | null = notificationRoute(notification);
    if (route) router.push(route);
  }

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen
        options={{
          title: t('notifications.title'),
          headerRight: () =>
            hasUnread ? (
              <Pressable
                onPress={() => markAll.mutate()}
                accessibilityRole="button"
                accessibilityLabel={t('notifications.markAllRead')}
                hitSlop={8}
              >
                <AppText variant="label" color="brand">
                  {t('notifications.markAllRead')}
                </AppText>
              </Pressable>
            ) : null,
        }}
      />

      {query.isLoading ? (
        <LoadingView />
      ) : query.isError && notifications.length === 0 ? (
        <ErrorView error={query.error} onRetry={() => void query.refetch()} />
      ) : notifications.length === 0 ? (
        <EmptyView
          title={t('notifications.emptyTitle')}
          description={t('notifications.emptyBody')}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => void query.refetch()}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          renderItem={({ item }) => <NotificationRow notification={item} onPress={() => open(item)} />}
        />
      )}
    </Screen>
  );
}

function NotificationRow({
  notification,
  onPress,
}: {
  notification: Notification;
  onPress: () => void;
}) {
  const at = parseIsoDate(notification.created_at);
  const unread = !notification.read_at;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}. ${notification.body}`}
      style={({ pressed }) => [styles.row, unread && styles.rowUnread, pressed && styles.rowPressed]}
    >
      <View style={[styles.dot, unread ? styles.dotOn : styles.dotOff]} />
      <View style={styles.body}>
        <View style={styles.topLine}>
          <AppText variant="subheading" numberOfLines={1} style={styles.title}>
            {notification.title}
          </AppText>
          {at ? (
            <AppText variant="caption" color="tertiary">
              {formatRelative(at)}
            </AppText>
          ) : null}
        </View>
        <AppText variant="bodySmall" color="secondary" numberOfLines={2}>
          {notification.body}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowUnread: {
    backgroundColor: colors.brand.primarySurface,
    borderRadius: radius.md,
  },
  rowPressed: {
    opacity: 0.7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  dotOn: {
    backgroundColor: colors.brand.primary,
  },
  dotOff: {
    backgroundColor: 'transparent',
  },
  body: {
    flex: 1,
    gap: spacing.xxs,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  separator: {
    height: spacing.xxs,
  },
});
