import { I18nManager } from 'react-native';

import { RTL_LOCALES, type SupportedLocale } from '@/config/constants';
import { createLogger } from '@/utils/logger';

/**
 * Right-to-left support.
 *
 * React Native decides layout direction natively, and `I18nManager.forceRTL`
 * only takes effect after the app restarts. So switching to Arabic is a
 * two-step flow: persist the choice, then prompt the user to restart (or call
 * `Updates.reloadAsync()` from `expo-updates`, which is not installed yet).
 *
 * Until an in-app language switcher exists, this module only records the
 * intent — nothing calls `applyDirectionForLocale` at startup on purpose, so
 * that enabling RTL is an explicit product decision rather than a side effect
 * of a device locale.
 */

const log = createLogger('rtl');

export function isRtlLocale(locale: SupportedLocale): boolean {
  return RTL_LOCALES.includes(locale);
}

/** Whether the app is currently laid out right-to-left. */
export function isLayoutRtl(): boolean {
  return I18nManager.isRTL;
}

/**
 * Aligns the native layout direction with a locale.
 * Returns `true` when a restart is required for the change to appear.
 */
export function applyDirectionForLocale(locale: SupportedLocale): boolean {
  const shouldBeRtl = isRtlLocale(locale);
  if (I18nManager.isRTL === shouldBeRtl) return false;

  I18nManager.allowRTL(shouldBeRtl);
  I18nManager.forceRTL(shouldBeRtl);
  log.info(`Layout direction set to ${shouldBeRtl ? 'RTL' : 'LTR'}; a restart is required.`);
  return true;
}
