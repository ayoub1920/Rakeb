import { CURRENCY_SYMBOL, MILLIMES_PER_DINAR } from '@/config/constants';

/**
 * Money formatting only.
 *
 * The API sends every amount as an integer number of millimes precisely so no
 * client ever does float arithmetic on prices. Totals, fees, discounts and
 * refunds are computed by the backend (`POST /trips/{id}/quote`,
 * `POST /promos/validate`, `POST /bookings/{id}/cancel`). Nothing in this file
 * adds, multiplies or discounts — see "Do not put pricing calculations in the
 * frontend" in `docs/FRONTEND_ARCHITECTURE.md`.
 */

export type FormatMillimesOptions = {
  /** Append the currency symbol. Default `true`. */
  withCurrency?: boolean;
  /** Drop the millimes part when it is zero: `15000` → `15 DT`. Default `false`. */
  compact?: boolean;
};

/** Groups the integer part in thousands: `1500` → `1 500`. */
function groupThousands(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Formats an integer millimes amount for display.
 *
 * `formatMillimes(15800)` → `'15,800 DT'`
 * `formatMillimes(15000, { compact: true })` → `'15 DT'`
 * `formatMillimes(-2500)` → `'-2,500 DT'`
 */
export function formatMillimes(
  millimes: number,
  { withCurrency = true, compact = false }: FormatMillimesOptions = {},
): string {
  if (!Number.isFinite(millimes)) {
    throw new Error(`formatMillimes expected a finite number, received ${millimes}`);
  }

  const rounded = Math.round(millimes);
  const sign = rounded < 0 ? '-' : '';
  const absolute = Math.abs(rounded);

  const dinars = Math.trunc(absolute / MILLIMES_PER_DINAR);
  const remainder = absolute % MILLIMES_PER_DINAR;

  const amount =
    compact && remainder === 0
      ? groupThousands(dinars)
      : `${groupThousands(dinars)},${String(remainder).padStart(3, '0')}`;

  return withCurrency ? `${sign}${amount} ${CURRENCY_SYMBOL}` : `${sign}${amount}`;
}

/** Converts millimes to dinars. For display and form inputs only. */
export function millimesToDinars(millimes: number): number {
  return millimes / MILLIMES_PER_DINAR;
}

/**
 * Converts a dinar amount typed by a user back into integer millimes.
 * Rounds, because a form input can produce `15.7999999`.
 */
export function dinarsToMillimes(dinars: number): number {
  return Math.round(dinars * MILLIMES_PER_DINAR);
}
