import { QUERY_SCOPES } from '@/api/query-keys';
import type { BookingBucket } from '@/types/models';

/** Query keys owned by the bookings feature. */
export const bookingKeys = {
  all: [QUERY_SCOPES.bookings] as const,
  list: (bucket: BookingBucket) => [QUERY_SCOPES.bookings, 'list', bucket] as const,
  detail: (bookingId: string) => [QUERY_SCOPES.bookings, 'detail', bookingId] as const,
};
