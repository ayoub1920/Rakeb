import type { ServiceDefinition } from '@/types/models';

/**
 * Offline catalogue.
 *
 * `GET /services` is the source of truth, but the home screen must render
 * something on a cold start with no connection — and the catalogue barely
 * changes. These definitions are used as placeholder data until the request
 * resolves, and as the fallback when it fails.
 *
 * Keep `status` honest here: shipping `taxi: 'live'` in the fallback would open
 * a service the backend has not enabled.
 */
export const FALLBACK_SERVICES: ServiceDefinition[] = [
  {
    id: 'carpool',
    status: 'live',
    name: 'Covoiturage',
    description: 'Partagez un trajet entre villes et réduisez vos frais de route.',
  },
  {
    id: 'taxi',
    status: 'coming_soon',
    name: 'Taxi',
    description: 'Commandez une course en ville. Bientôt disponible.',
  },
  {
    id: 'food',
    status: 'coming_soon',
    name: 'Restauration',
    description: 'Faites-vous livrer un repas. Bientôt disponible.',
  },
  {
    id: 'grocery',
    status: 'coming_soon',
    name: 'Courses',
    description: 'Vos courses livrées à domicile. Bientôt disponible.',
  },
];
