import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from '@/config/constants';

import ar from './locales/ar.json';
import fr from './locales/fr.json';

/**
 * i18next setup.
 *
 * French is the default and the only complete catalogue. Arabic exists so that
 * RTL and the language switch can be exercised end to end; it is intentionally
 * not a full translation, and placeholder screens are not translated at all —
 * they are development scaffolding, not product copy.
 *
 * Keys are namespaced by area (`common`, `tabs`, `auth`, `errors`). Add a key
 * to `fr.json` first; a missing Arabic key falls back to French rather than
 * rendering the raw key.
 */

export const resources = {
  fr: { translation: fr },
  ar: { translation: ar },
} as const;

/** Picks the best supported locale for the device, defaulting to French. */
export function resolveDeviceLocale(): SupportedLocale {
  const preferred = getLocales()
    .map((locale) => locale.languageCode)
    .find(
      (code): code is SupportedLocale =>
        code !== null && SUPPORTED_LOCALES.includes(code as SupportedLocale),
    );
  return preferred ?? DEFAULT_LOCALE;
}

let initialized = false;

export function initI18n(locale: SupportedLocale = resolveDeviceLocale()) {
  if (initialized) return i18n;

  void i18n.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
    // React already escapes everything it renders.
    interpolation: { escapeValue: false },
    returnNull: false,
    // Resources are bundled, so there is nothing to load asynchronously.
    // Without this, i18next defers initialization to a timeout and the first
    // render happens against an uninitialized instance.
    initAsync: false,
    // Suspense would need a boundary above every translated component, and the
    // catalogues are already in memory by the time anything renders.
    react: { useSuspense: false },
  });

  initialized = true;
  return i18n;
}

export function changeLocale(locale: SupportedLocale): Promise<unknown> {
  return i18n.changeLanguage(locale);
}

export { i18n };
