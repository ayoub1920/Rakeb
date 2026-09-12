import type { Href } from 'expo-router';

import { toCursorParams } from '@/api/pagination';
import { apiDelete, apiGet, apiPost, apiPut } from '@/api/request';
import type { SupportedLocale } from '@/config/constants';
import type { DeviceRegistration } from '@/services/notifications/types';
import type { CursorPage, RequestOptions } from '@/types/api';
import type {
  MarkAllReadResponse,
  NotificationResponse,
  PaginatedResponse,
  UnreadCountResponse,
} from '@/types/api-responses';
import type { Notification } from '@/types/models';

/**
 * In-app notifications — the feed the backend already writes on booking
 * accepted / new message / departure reminder, plus the device-token and
 * per-event preference endpoints.
 *
 * Backend: `src/modules/notifications` (`GET /me/notifications`,
 * `GET /me/notifications/unread-count`, `POST /me/notifications/{id}/read`,
 * `POST /me/notifications/read-all`), `GET·PUT /me/notification-settings`,
 * `POST·DELETE /me/devices`.
 */

/** Wire → domain. Exported for the WebSocket live-update handler. */
export function toNotification(dto: NotificationResponse): Notification {
  return {
    id: dto.id,
    type: dto.type as Notification['type'],
    title: dto.title,
    body: dto.body,
    data: dto.data ?? {},
    read_at: dto.read_at,
    created_at: dto.created_at,
  };
}

/**
 * Turns a notification into an in-app destination.
 *
 * Routing is by **type**, not just by which `data` keys are present: a
 * `booking_requested` notification carries `booking_id` but goes to the
 * *driver*, whose screen is the request inbox (`/carpool/requests/{trip}`) —
 * not the rider's booking detail. Returns `null` when there is nothing useful
 * to open (the row is still marked read).
 */
export function notificationRoute(notification: Notification): Href | null {
  const { type, data } = notification;
  const booking = data.booking_id ? (`/carpool/booking/${data.booking_id}` as Href) : null;
  const trip = data.trip_id ? (`/carpool/trip/${data.trip_id}` as Href) : null;
  const conversation = data.conversation_id
    ? (`/carpool/conversation/${data.conversation_id}` as Href)
    : null;
  const requests = data.trip_id ? (`/carpool/requests/${data.trip_id}` as Href) : null;

  switch (type) {
    // Driver-facing
    case 'booking_requested':
      return requests ?? trip;
    case 'wallet_credited':
      return '/profile/wallet' as Href;

    // Rider-facing booking lifecycle
    case 'booking_accepted':
    case 'booking_declined':
    case 'booking_cancelled':
    case 'booking_expired':
    case 'trip_cancelled':
    case 'payment_captured':
    case 'payment_refunded':
      return booking ?? trip;
    case 'review_request':
      return data.booking_id ? (`/carpool/review/${data.booking_id}` as Href) : booking;

    // Messaging
    case 'new_message':
      return conversation;

    // Trip-level. When the notification carries a booking (rider side) open the
    // booking so the rider sees the live status; otherwise fall back to the trip.
    case 'departure_reminder':
    case 'trip_started':
    case 'trip_completed':
      return booking ?? trip;
    case 'trip_alert':
      return trip;

    // Account
    case 'verification_approved':
    case 'verification_rejected':
      return '/profile/verifications' as Href;
    case 'sos':
      return '/support' as Href;
    case 'support_message':
      return data.kind === 'support_chat_admin' && data.conversation_id
        ? (`/admin/support/${data.conversation_id}` as Href)
        : ('/support/chat' as Href);

    // Taxi — a new request routes the driver straight to the dispatch
    // screen; every ride-lifecycle event routes to the ride itself, on the
    // side (`data.audience`) the notification was sent to.
    case 'taxi_ride_requested':
      return '/taxi/driver/online' as Href;
    case 'taxi_ride_accepted':
    case 'taxi_ride_taken':
    case 'taxi_driver_arriving':
    case 'taxi_driver_arrived':
    case 'taxi_ride_started':
    case 'taxi_ride_completed':
    case 'taxi_ride_cancelled':
    case 'taxi_ride_expired':
      if (!data.ride_id) return '/taxi' as Href;
      return data.audience === 'driver'
        ? (`/taxi/driver/ride/${data.ride_id}` as Href)
        : (`/taxi/passenger/ride/${data.ride_id}` as Href);
    case 'taxi_application_approved':
    case 'taxi_application_rejected':
      return '/taxi/driver/status' as Href;

    default:
      return conversation ?? booking ?? trip;
  }
}

/** `GET /me/notifications?cursor=&limit=&unread_only=` */
export async function getNotifications(
  { unreadOnly = false, cursor }: { unreadOnly?: boolean; cursor?: string | null },
  options?: RequestOptions,
): Promise<CursorPage<Notification>> {
  const page = await apiGet<PaginatedResponse<NotificationResponse>>(
    '/me/notifications',
    { ...toCursorParams(cursor), ...(unreadOnly ? { unread_only: true } : {}) },
    options,
  );
  return {
    items: page.items.map(toNotification),
    next_cursor: page.next_cursor,
    total: page.total,
  };
}

/** `GET /me/notifications/unread-count` */
export async function getUnreadCount(options?: RequestOptions): Promise<number> {
  const res = await apiGet<UnreadCountResponse>(
    '/me/notifications/unread-count',
    undefined,
    options,
  );
  return res.unread_count;
}

/** `POST /me/notifications/{id}/read` */
export async function markNotificationRead(id: string, options?: RequestOptions): Promise<void> {
  await apiPost<void>(`/me/notifications/${id}/read`, undefined, options);
}

/** `POST /me/notifications/read-all` */
export async function markAllNotificationsRead(options?: RequestOptions): Promise<number> {
  const res = await apiPost<MarkAllReadResponse>('/me/notifications/read-all', undefined, options);
  return res.updated;
}

// --- Per-event preferences ------------------------------------------------

/** `GET·PUT /me/notification-settings` — mirrors the backend response. */
export type NotificationSettings = {
  booking_accepted: boolean;
  new_message: boolean;
  departure_reminder: boolean;
  trip_alerts: boolean;
  marketing: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
};

export function getNotificationSettings(
  options?: RequestOptions,
): Promise<NotificationSettings> {
  return apiGet<NotificationSettings>('/me/notification-settings', undefined, options);
}

export function updateNotificationSettings(
  settings: NotificationSettings,
  options?: RequestOptions,
): Promise<NotificationSettings> {
  return apiPut<NotificationSettings>('/me/notification-settings', settings, options);
}

// --- Device registration ------------------------------------------------

export type RegisteredDevice = { id: string; platform: string; locale: string; created_at: string };

/** `POST /me/devices` — upserts on the push token. */
export function registerDevice(
  payload: DeviceRegistration,
  options?: RequestOptions,
): Promise<RegisteredDevice> {
  return apiPost<RegisteredDevice>('/me/devices', payload, options);
}

/** `DELETE /me/devices/{id}` — called on sign-out. */
export function unregisterDevice(deviceId: string, options?: RequestOptions): Promise<void> {
  return apiDelete<void>(`/me/devices/${deviceId}`, options);
}

/** Convenience for a locale-aware registration payload. */
export async function registerCurrentDevice(
  locale: SupportedLocale,
): Promise<RegisteredDevice | null> {
  const { notificationService } = await import('@/services/notifications/notification-service');
  const payload = await notificationService.buildDeviceRegistration(locale);
  if (!payload) return null;
  return registerDevice(payload);
}
