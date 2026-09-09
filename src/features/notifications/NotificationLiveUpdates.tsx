import { useNotificationLiveUpdates } from './use-notification-live-updates';
import { useNotificationResponse } from './use-notification-response';

/**
 * Mount once, high in the tree (root layout), so the `/ws/notifications`
 * subscription and the OS push-tap handler follow the whole session rather
 * than a single screen. Renders nothing.
 */
export function NotificationLiveUpdates() {
  useNotificationLiveUpdates();
  useNotificationResponse();
  return null;
}
