import { useQuery } from '@tanstack/react-query';

import { STALE_TIME } from '@/api/query-client';
import type { ApiError } from '@/types/api';
import type { AppConfig, ServiceDefinition } from '@/types/models';

import { getAppConfig, getServices } from './api';
import { FALLBACK_SERVICES } from './fallback-services';
import { serviceKeys } from './keys';

/**
 * Catalogue queries.
 *
 * Both use `STALE_TIME.static`: the catalogue and the config change on deploy,
 * not during a session, and refetching them on every screen is wasted battery.
 */

/**
 * `GET /services`.
 *
 * `placeholderData` is the local catalogue, so the home screen renders services
 * on the first frame of a cold start and swaps in the server's answer when it
 * arrives. `FALLBACK_SERVICES` is intentionally not `initialData` — that would
 * mark the local list as fresh and skip the request entirely.
 */
export function useServices() {
  return useQuery<ServiceDefinition[], ApiError>({
    queryKey: serviceKeys.catalogue(),
    queryFn: ({ signal }) => getServices({ signal }),
    staleTime: STALE_TIME.static,
    placeholderData: FALLBACK_SERVICES,
  });
}

/** `GET /config`. */
export function useAppConfig() {
  return useQuery<AppConfig, ApiError>({
    queryKey: serviceKeys.appConfig(),
    queryFn: ({ signal }) => getAppConfig({ signal }),
    staleTime: STALE_TIME.static,
  });
}
