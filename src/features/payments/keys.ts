import { QUERY_SCOPES } from '@/api/query-keys';

/**
 * Query keys owned by the payments feature.
 *
 * Promos live here rather than in `features/services` because validating a
 * promo code (`POST /promos/validate`) is a checkout concern — see the boundary
 * note in `docs/API_FRONTEND_ANALYSIS.md` §12.
 */
export const paymentKeys = {
  all: [QUERY_SCOPES.payments] as const,
  promoBanners: () => [QUERY_SCOPES.payments, 'promo-banners'] as const,
  methods: () => [QUERY_SCOPES.payments, 'methods'] as const,
};
