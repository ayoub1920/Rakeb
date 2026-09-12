import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { useIsAuthenticated } from '@/auth/use-auth';
import { AppText } from '@/components';
import { env } from '@/config/env';
import { colors, radius, spacing } from '@/theme';

import { useSupportUnreadCount } from './chat-queries';
import { SupportChatSheet } from './SupportChatSheet';

/**
 * Floating "contact support" affordance — a headset button that opens the live
 * chat sheet. Rendered on the main tabs and the active-trip screens (see
 * `(tabs)/_layout` and the carpool tracking/requests screens). Hidden until the
 * user is signed in; a dot marks unread staff replies.
 *
 * `bottom` lets each host clear its own furniture (the tab bar, a sticky CTA).
 */
export function SupportButton({ bottom = spacing.xl }: { bottom?: number }) {
  const isAuthenticated = useIsAuthenticated();
  const [open, setOpen] = useState(false);
  const unread = useSupportUnreadCount();

  // No websocket in mock mode, and nobody to talk to when signed out.
  if (!isAuthenticated || env.enableMockApi) return null;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Contacter le support"
        style={({ pressed }) => [styles.fab, { bottom }, pressed && styles.fabPressed]}
      >
        <Ionicons name="headset" size={24} color={colors.text.inverse} />
        {unread > 0 ? (
          <View style={styles.badge}>
            <AppText variant="caption" color="inverse" style={styles.badgeText}>
              {unread > 9 ? '9+' : unread}
            </AppText>
          </View>
        ) : null}
      </Pressable>

      <SupportChatSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const SIZE = 52;

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: SIZE,
    height: SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 6 },
      default: {
        boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
      },
    }),
  },
  fabPressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.default,
  },
  badgeText: { fontSize: 10, lineHeight: 14 },
});
