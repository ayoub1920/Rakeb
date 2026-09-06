import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { STALE_TIME } from '@/api/query-client';
import { useIsAuthenticated } from '@/auth/use-auth';
import type { ApiError } from '@/types/api';
import type {
  Id,
  MobileMoneyProvider,
  PaymentMethod,
  PromoBanner,
  PromoValidation,
} from '@/types/models';

import {
  addCard,
  addMobileMoney,
  deletePaymentMethod,
  getPaymentMethods,
  getPromoBanners,
  updatePaymentMethod,
  validatePromo,
} from './api';
import { paymentKeys } from './keys';

/**
 * `GET /promos/banners`.
 *
 * `STALE_TIME.static`: campaigns change on a marketing cadence, not within a
 * session. Gated on the session because banners can be personalized, and an
 * unauthenticated call would 401 on the home screen the guard has already let
 * through.
 */
export function usePromoBanners() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<PromoBanner[], ApiError>({
    queryKey: paymentKeys.promoBanners(),
    queryFn: ({ signal }) => getPromoBanners({ signal }),
    enabled: isAuthenticated,
    staleTime: STALE_TIME.static,
  });
}

/**
 * `GET /payment-methods`.
 *
 * `STALE_TIME.session`: the list changes only through the user's own actions
 * (adding a card, changing the default), so a session-length cache is safe and
 * the booking screen opens without a spinner on the payment row.
 */
export function usePaymentMethods() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<PaymentMethod[], ApiError>({
    queryKey: paymentKeys.methods(),
    queryFn: ({ signal }) => getPaymentMethods({ signal }),
    enabled: isAuthenticated,
    staleTime: STALE_TIME.session,
  });
}

/**
 * `POST /promos/validate`.
 *
 * A mutation, not a query: the user submits a code explicitly and the result is
 * folded into the booking screen's local state, not cached. The seat count is
 * part of the request because the discount is computed against the fare.
 */
export function useValidatePromo(tripId: Id) {
  return useMutation<PromoValidation, ApiError, { code: string; seats: number }>({
    mutationFn: ({ code, seats }) => validatePromo(code, tripId, seats),
  });
}

function useMethodMutation<TVars>(fn: (vars: TVars) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, TVars>({
    mutationFn: fn,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: paymentKeys.methods() }),
  });
}

/** `POST /payment-methods` — add a card from a PSP token. */
export function useAddCard() {
  return useMethodMutation<{ provider_token: string; label?: string; set_default?: boolean }>(
    (input) => addCard(input),
  );
}

/** `POST /payment-methods/mobile`. */
export function useAddMobileMoney() {
  return useMethodMutation<{
    provider: MobileMoneyProvider;
    msisdn: string;
    set_default?: boolean;
  }>((input) => addMobileMoney(input));
}

/** `PATCH /payment-methods/{id}` — set default / rename. */
export function useUpdatePaymentMethod() {
  return useMethodMutation<{ id: Id; is_default?: boolean; label?: string }>(({ id, ...rest }) =>
    updatePaymentMethod(id, rest),
  );
}

/** `DELETE /payment-methods/{id}`. */
export function useDeletePaymentMethod() {
  return useMethodMutation<Id>((id) => deletePaymentMethod(id));
}
