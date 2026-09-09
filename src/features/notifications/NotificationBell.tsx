import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components';
import { colors, radius, sizes, spacing } from '@/theme';

import { useUnreadCount } from './queries';

/**
 * Header bell + unread badge. Drop into `ScreenHeader`'s `trailing` slot.
 * The count is kept live by `useNotificationLiveUpdates` (mounted at the root)
 * and by `useUnreadCount`'s poll fallback.
 */
export function NotificationBell() {
  const { data: unread = 0 } = useUnreadCount();
  const label =
    unread > 0 ? `Notifications, ${unread} non lue${unread > 1 ? 's' : ''}` : 'Notifications';

  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={sizes.hitSlop}
      style={styles.button}
    >
      <AppText variant="heading">🔔</AppText>
      {unread > 0 ? (
        <View style={styles.badge}>
          <AppText variant="caption" color="inverse">
            {unread > 99 ? '99+' : unread}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: sizes.icon.lg,
    minHeight: sizes.icon.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -spacing.xxs,
    right: -spacing.xs,
    minWidth: 18,
    height: 18,
    paddingHorizontal: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
