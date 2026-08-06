import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';
import { ar, fr } from 'date-fns/locale';

import { DEFAULT_LOCALE, type SupportedLocale } from '@/config/constants';

/**
 * Date parsing and formatting.
 *
 * The API speaks ISO 8601 for timestamps (`departure_at`) and `yyyy-MM-dd` for
 * calendar dates (`/trips/search?date=`). Everything crossing that boundary
 * goes through this module so the two never get confused.
 */

const LOCALES = { fr, ar } as const;

function localeFor(locale: SupportedLocale = DEFAULT_LOCALE) {
  return LOCALES[locale] ?? fr;
}

/**
 * Parses an ISO string from the API.
 * Returns `null` instead of an `Invalid Date`, so a bad value fails at the
 * boundary rather than rendering as `NaN` three components deep.
 */
export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

/** Serializes a `Date` to the `yyyy-MM-dd` form the search endpoint expects. */
export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** `lundi 6 août 2026` */
export function formatLongDate(date: Date, locale?: SupportedLocale): string {
  return format(date, 'EEEE d MMMM yyyy', { locale: localeFor(locale) });
}

/** `6 août` */
export function formatShortDate(date: Date, locale?: SupportedLocale): string {
  return format(date, 'd MMM', { locale: localeFor(locale) });
}

/** `14:30` — 24-hour, which is what Tunisian users expect. */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

/** `6 août à 14:30` */
export function formatDateTime(date: Date, locale?: SupportedLocale): string {
  const resolved = localeFor(locale);
  return `${format(date, 'd MMM', { locale: resolved })} ${format(date, 'HH:mm')}`;
}

/** `il y a 5 minutes` — used for message and booking timestamps. */
export function formatRelative(date: Date, locale?: SupportedLocale): string {
  return formatDistanceToNowStrict(date, { addSuffix: true, locale: localeFor(locale) });
}

/**
 * Convenience for the common case: an ISO string straight from the API that
 * should render as a time, or as a fallback when the value is missing.
 */
export function formatIsoTime(value: string | null | undefined, fallback = '--:--'): string {
  const date = parseIsoDate(value);
  return date ? formatTime(date) : fallback;
}
