import { apiGet } from '@/api/request';
import type { RequestOptions } from '@/types/api';
import type { AppConfig, ServiceDefinition } from '@/types/models';

/**
 * Service catalogue and app configuration — `API Rakeb.md` §12.
 *
 * Both are public: they are fetched before a session exists so the home screen
 * can render, hence `skipAuth`.
 *
 * Not implemented here: `/promos/banners`, `/me/referral`, `/referrals/claim`
 * and `/promos/validate` — promos belong to `features/payments`.
 */

/** `GET /services` — the catalogue, with `status: 'live' | 'coming_soon'`. */
export function getServices(options?: RequestOptions): Promise<ServiceDefinition[]> {
  return apiGet<ServiceDefinition[]>('/services', undefined, { skipAuth: true, ...options });
}

/** `GET /config` — feature flags, currency, price bounds, minimum app version. */
export function getAppConfig(options?: RequestOptions): Promise<AppConfig> {
  return apiGet<AppConfig>('/config', undefined, { skipAuth: true, ...options });
}
