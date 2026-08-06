import type { Href } from 'expo-router';

import type { ServiceDefinition, ServiceId } from '@/types/models';

/**
 * Maps a service to the route that opens it.
 *
 * This is the seam for the whole multi-service product. A service going live
 * is: the backend flips `status` in `GET /services`, and a route is added here.
 * Nothing that renders the catalogue changes.
 *
 * A `null` entry means "no entry route yet" — the catalogue opens the
 * coming-soon modal instead.
 */
const SERVICE_ROUTES: Record<ServiceId, Href | null> = {
  carpool: '/carpool/search',
  taxi: null,
  food: null,
  grocery: null,
};

/**
 * Where tapping a service should navigate.
 *
 * Returns `null` when the service is not live *or* has no route — the status
 * from the API wins over the local table, so a service can be switched off
 * server-side without shipping an app update.
 */
export function getServiceRoute(service: ServiceDefinition): Href | null {
  if (service.status !== 'live') return null;
  return SERVICE_ROUTES[service.id] ?? null;
}

export function isServiceAvailable(service: ServiceDefinition): boolean {
  return getServiceRoute(service) !== null;
}
