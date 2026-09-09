import i18n from 'i18next';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from '@/config/constants';
import { createLogger } from '@/utils/logger';

import { registerCurrentDevice, unregisterDevice } from './api';

/**
 * Push-token lifecycle, tied to the session.
 *
 * `POST /me/devices` after sign-in so this account starts receiving pushes;
 * `DELETE /me/devices/{id}` on sign-out so a shared handset stops receiving the
 * previous account's. The returned device id is kept in the OS keystore so a
 * logout after an app restart can still target the right row.
 *
 * Everything here is best-effort: a denied permission, a simulator, or an
 * offline device must never block sign-in or sign-out.
 */

const log = createLogger('device-registration');
const DEVICE_ID_KEY = 'rakeb.device_id';

function currentLocale(): SupportedLocale {
  const lng = i18n.resolvedLanguage ?? i18n.language ?? DEFAULT_LOCALE;
  return (SUPPORTED_LOCALES as readonly string[]).includes(lng)
    ? (lng as SupportedLocale)
    : DEFAULT_LOCALE;
}

async function readDeviceId(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    return await SecureStore.getItemAsync(DEVICE_ID_KEY);
  } catch {
    return null;
  }
}

async function writeDeviceId(id: string | null): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (id) await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
    else await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
  } catch {
    /* ignore keystore errors */
  }
}

/** Register this device's push token for the signed-in user. */
export async function syncDeviceRegistration(): Promise<void> {
  try {
    const device = await registerCurrentDevice(currentLocale());
    if (device) {
      await writeDeviceId(device.id);
      log.debug('device registered');
    }
  } catch (error) {
    log.warn('device registration failed', error);
  }
}

/** Remove this device's registration. Call while the access token is still valid. */
export async function removeDeviceRegistration(): Promise<void> {
  const id = await readDeviceId();
  if (!id) return;
  try {
    await unregisterDevice(id);
  } catch (error) {
    log.warn('device unregistration failed', error);
  } finally {
    await writeDeviceId(null);
  }
}
