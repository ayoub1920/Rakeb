import { apiGet, apiPost } from '@/api/request';
import type { RequestOptions } from '@/types/api';
import type { PendingReviewResponse, ReviewTagResponse } from '@/types/api-responses';
import type { PendingReview, ReviewTag } from '@/types/models';

/**
 * Ratings, compliment tags and tips after a completed trip — `API Rakeb.md` §10.
 *
 * `GET /users/{id}/reviews` (reviews *received*) is read in `features/profile`,
 * not here.
 */

/** Tags a passenger can give a driver: shared tags plus rider→driver ones. */
const RIDER_DIRECTIONS = new Set(['both', 'rider_to_driver']);

/** `GET /reviews/tags` — the compliment chips. Static catalogue data. */
export async function getReviewTags(options?: RequestOptions): Promise<ReviewTag[]> {
  const rows = await apiGet<ReviewTagResponse[]>('/reviews/tags', undefined, options);
  return rows
    .filter((tag) => RIDER_DIRECTIONS.has(tag.direction))
    .map((tag) => ({ id: tag.code, label: tag.label }));
}

/** `GET /me/pending-reviews` — trips waiting to be rated. */
export async function getPendingReviews(options?: RequestOptions): Promise<PendingReview[]> {
  const rows = await apiGet<PendingReviewResponse[]>('/me/pending-reviews', undefined, options);
  return rows.map((row) => ({
    booking_id: row.booking_id,
    trip_label: row.trip_label,
    peer_first_name: row.target_display_name,
    trip_date: row.departure_at,
  }));
}

export type SubmitReviewInput = {
  rating: number;
  tags: string[];
  comment?: string | null;
};

/** `POST /bookings/{id}/review` — `{ rating: 1-5, tags, comment }`. */
export function submitReview(
  bookingId: string,
  input: SubmitReviewInput,
  options?: RequestOptions,
): Promise<void> {
  return apiPost<void>(`/bookings/${bookingId}/review`, input, options);
}

/** `POST /bookings/{id}/tip` — `{ amount }` in millimes (1 / 2 / 5 DT or free). */
export function submitTip(
  bookingId: string,
  amount: number,
  options?: RequestOptions,
): Promise<void> {
  return apiPost<void>(`/bookings/${bookingId}/tip`, { amount }, options);
}
