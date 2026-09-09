import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { STALE_TIME } from '@/api/query-client';
import { QUERY_SCOPES } from '@/api/query-keys';
import { useIsAuthenticated } from '@/auth/use-auth';
import type { ApiError } from '@/types/api';
import type { PendingReview, ReviewTag } from '@/types/models';

import {
  getPendingReviews,
  getReviewTags,
  submitReview,
  submitTip,
  type SubmitReviewInput,
} from './api';
import { reviewKeys } from './keys';

/** `GET /reviews/tags` — static catalogue data. Requires auth like every `/reviews/*`. */
export function useReviewTags() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<ReviewTag[], ApiError>({
    queryKey: reviewKeys.tags(),
    queryFn: ({ signal }) => getReviewTags({ signal }),
    enabled: isAuthenticated,
    staleTime: STALE_TIME.static,
  });
}

/** `GET /me/pending-reviews`. */
export function usePendingReviews() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<PendingReview[], ApiError>({
    queryKey: reviewKeys.pending(),
    queryFn: ({ signal }) => getPendingReviews({ signal }),
    enabled: isAuthenticated,
    staleTime: STALE_TIME.volatile,
  });
}

/**
 * `POST /bookings/{id}/review`, then optionally `POST /bookings/{id}/tip`.
 *
 * The tip is a second call because it is a payment and can fail on its own; a
 * failed tip must not lose the review. Submitting invalidates the pending list
 * and the reviewed booking.
 */
export function useSubmitReview(bookingId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, SubmitReviewInput & { tip?: number | null }>({
    mutationFn: async ({ tip, ...review }) => {
      await submitReview(bookingId, review);
      if (tip && tip > 0) {
        await submitTip(bookingId, tip);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reviewKeys.pending() });
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.bookings] });
      // A tip is a wallet debit.
      void queryClient.invalidateQueries({ queryKey: [QUERY_SCOPES.wallet] });
    },
  });
}
