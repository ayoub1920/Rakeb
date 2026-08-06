import { useTranslation } from 'react-i18next';

import { DEFAULT_LOCALE, type SupportedLocale } from '@/config/constants';

import { changeLocale } from './i18n';
import { applyDirectionForLocale, isRtlLocale } from './rtl';

/**
 * Current locale plus the switcher.
 *
 * `setLocale` returns whether the app must restart for the layout direction to
 * change — the caller decides how to say so (a dialog on a settings screen, a
 * silent no-op during onboarding).
 */
export function useLocale() {
  const { i18n } = useTranslation();
  const locale = (i18n.resolvedLanguage ?? DEFAULT_LOCALE) as SupportedLocale;

  return {
    locale,
    isRtl: isRtlLocale(locale),
    async setLocale(next: SupportedLocale): Promise<{ requiresRestart: boolean }> {
      await changeLocale(next);
      return { requiresRestart: applyDirectionForLocale(next) };
    },
  };
}
