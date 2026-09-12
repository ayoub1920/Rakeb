import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';

import type { SupportedLocale } from '@/config/constants';
import { createLogger } from '@/utils/logger';

import type {
  DeviceRegistration,
  NotificationPermissionStatus,
  NotificationService,
} from './types';

/**
 * Expo Notifications adapter.
 *
 * Deliberately inert at startup: nothing here runs unless a screen calls it.
 * The permission prompt belongs after an explanation ("be told when your
 * booking is accepted"), not on first launch.
 *
 * `buildDeviceRegistration` stops at the payload. Sending it is
 * `POST /me/devices`, which belongs to `features/notifications` — this service
 * knows about the device, not about the API.
 *
 * `expo-notifications` throws on import on Android under Expo Go (removed
 * there since SDK 53 — see https://docs.expo.dev/develop/development-builds/introduction/).
 * `require()` it lazily so that import never runs there instead of crashing
 * the app; a development build is unaffected.
 */

const log = createLogger('notifications');

function getNotifications(): typeof NotificationsModule | null {
  if (Platform.OS === 'android' && isRunningInExpoGo()) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as typeof NotificationsModule;
}

function toStatus(status: NotificationsModule.PermissionStatus): NotificationPermissionStatus {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

function currentPlatform(): DeviceRegistration['platform'] {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

export const notificationService: NotificationService = {
  async getPermissionStatus() {
    const Notifications = getNotifications();
    if (!Notifications) return 'undetermined';
    const { status } = await Notifications.getPermissionsAsync();
    return toStatus(status);
  },

  async requestPermission() {
    const Notifications = getNotifications();
    if (!Notifications) return 'undetermined';
    const { status } = await Notifications.requestPermissionsAsync();
    return toStatus(status);
  },

  async getPushToken() {
    const Notifications = getNotifications();
    if (!Notifications) {
      log.debug('Push notifications are unavailable on Android in Expo Go.');
      return null;
    }

    // Push tokens are not issued to simulators, and asking for one there throws.
    if (!Device.isDevice) {
      log.debug('Push tokens are unavailable on a simulator.');
      return null;
    }

    if ((await notificationService.getPermissionStatus()) !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      log.warn('No EAS projectId — push tokens require an EAS project.');
      return null;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      return token.data;
    } catch (error) {
      log.warn('Failed to obtain an Expo push token', error);
      return null;
    }
  },

  async buildDeviceRegistration(locale: SupportedLocale) {
    const pushToken = await notificationService.getPushToken();
    if (!pushToken) return null;
    return { platform: currentPlatform(), push_token: pushToken, locale };
  },
};
