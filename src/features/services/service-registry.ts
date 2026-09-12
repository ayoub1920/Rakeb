import type { Href } from 'expo-router';

import type { IconName } from '@/components';
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
  // The taxi landing page (passenger vs. driver), not the search screen
  // directly — see src/app/taxi/index.tsx.
  taxi: '/taxi' as Href,
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

/**
 * An icon per service, for the catalogue and the home screen's shortcuts.
 *
 * Local, like `SERVICE_ROUTES` above: `GET /services` carries no icon field,
 * and adding one would be a backend change this pass doesn't make.
 */
const SERVICE_ICONS: Record<ServiceId, IconName> = {
  carpool: 'people-outline',
  taxi: 'car-sport-outline',
  food: 'fast-food-outline',
  grocery: 'basket-outline',
};

export function getServiceIcon(service: ServiceDefinition): IconName {
  return SERVICE_ICONS[service.id] ?? 'apps-outline';
}
