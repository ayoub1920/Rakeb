import { isRunningInExpoGo } from 'expo';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { createLogger } from '@/utils/logger';

import { notificationRoute } from './api';
import type { Notification } from '@/types/models';

const log = createLogger('notifications.response');

let handlerSet = false;

/**
 * Wires OS push notifications into in-app navigation.
 *
 * - `setNotificationHandler` so a push received while the app is foregrounded
 *   still shows a banner.
 * - `addNotificationResponseReceivedListener` so tapping a push (cold start or
 *   background) deep-links through the same `notificationRoute()` the in-app
 *   feed rows use.
 *
 * Mount once, high in the tree. No-op on web (no OS notification tray).
 *
 * `expo-notifications` throws on import on Android under Expo Go (removed
 * there since SDK 53 — see https://docs.expo.dev/develop/development-builds/introduction/).
 * `require()` it lazily so that import never runs there instead of crashing
 * the app; a development build is unaffected.
 */
export function useNotificationResponse() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (Platform.OS === 'android' && isRunningInExpoGo()) {
      log.debug('Push notifications are unavailable on Android in Expo Go; skipping.');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    // Guards the jest/jsdom environment where the native module is absent.
    if (typeof Notifications.addNotificationResponseReceivedListener !== 'function') return;

    if (!handlerSet) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: true,
        }),
      });
      if (Platform.OS === 'android') {
        void Notifications.setNotificationChannelAsync('default', {
          name: 'Général',
          importance: Notifications.AndroidImportance.DEFAULT,
        }).catch(() => undefined);
      }
      handlerSet = true;
    }

    const go = (data: Record<string, unknown> | undefined) => {
      if (!data || typeof data.type !== 'string') return;
      const notification: Notification = {
        id: String(data.id ?? ''),
        type: data.type as Notification['type'],
        title: '',
        body: '',
        data: data as Notification['data'],
        read_at: null,
        created_at: new Date().toISOString(),
      };
      const href = notificationRoute(notification);
      if (href) {
        try {
          router.push(href);
        } catch (error) {
          log.warn(`failed to open ${String(href)}: ${String(error)}`);
        }
      }
    };

    // Cold start: the app was launched by tapping a push.
    void Notifications.getLastNotificationResponseAsync?.()
      .then((response) => {
        const data = response?.notification?.request?.content?.data;
        if (data) go(data as Record<string, unknown>);
      })
      .catch(() => undefined);

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      go(response?.notification?.request?.content?.data as Record<string, unknown>);
    });

    return () => sub?.remove?.();
  }, []);
}
