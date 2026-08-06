import type { SupportedLocale } from '@/config/constants';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

/** Payload for `POST /me/devices`. */
export type DeviceRegistration = {
  platform: 'ios' | 'android' | 'web';
  push_token: string;
  locale: SupportedLocale;
};

/** `GET · PUT /me/notification-settings`. */
export type NotificationSettings = {
  booking_accepted: boolean;
  new_message: boolean;
  departure_reminder: boolean;
};

/**
 * Notification categories the backend sends. Kept as a union so a handler can
 * be exhaustive over them once deep links are implemented.
 */
export type NotificationCategory =
  'booking_accepted' | 'booking_declined' | 'new_message' | 'departure_reminder' | 'trip_alert';

export interface NotificationService {
  getPermissionStatus(): Promise<NotificationPermissionStatus>;
  /** Prompts. Call after the user has seen why notifications matter. */
  requestPermission(): Promise<NotificationPermissionStatus>;
  /** Expo push token, or `null` when permission is missing or on a simulator. */
  getPushToken(): Promise<string | null>;
  /** Builds the `POST /me/devices` payload. Does not send it. */
  buildDeviceRegistration(locale: SupportedLocale): Promise<DeviceRegistration | null>;
}
