/** App-wide constants that are not environment dependent. */

/** Every REST route is served under this prefix. See `API Rakeb.md`. */
export const API_PREFIX = '/v1';

/** Axios request timeout. Long enough for a cold Nest start, short enough to fail fast. */
export const REQUEST_TIMEOUT_MS = 15_000;

/** Default `limit` for cursor-paginated endpoints, matching the API default. */
export const DEFAULT_PAGE_SIZE = 20;

/** Correlation header echoed back by the API and surfaced in `ApiError.requestId`. */
export const REQUEST_ID_HEADER = 'x-request-id';

/** Amounts are integer millimes across the whole API. 1 DT = 1000 millimes. */
export const MILLIMES_PER_DINAR = 1000;

/** ISO 4217 code for the Tunisian dinar. Displayed as `DT`. */
export const CURRENCY_CODE = 'TND';
export const CURRENCY_SYMBOL = 'DT';

export const DEFAULT_LOCALE = 'fr' as const;
export const SUPPORTED_LOCALES = ['fr', 'ar'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Locales that render right-to-left. */
export const RTL_LOCALES: readonly SupportedLocale[] = ['ar'];

/** Tunisia, used to centre the map before a user position is known. */
export const DEFAULT_MAP_REGION = {
  latitude: 36.8065,
  longitude: 10.1815,
  latitudeDelta: 3,
  longitudeDelta: 3,
} as const;
