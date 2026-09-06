import { apiDelete, apiGet, apiPatch, apiPost } from '@/api/request';
import type { RequestOptions } from '@/types/api';
import type {
  PaymentMethodResponse,
  PromoBannerResponse,
  ValidatePromoResponse,
} from '@/types/api-responses';
import type {
  Id,
  MobileMoneyProvider,
  PaymentMethod,
  PaymentMethodKind,
  PromoBanner,
  PromoValidation,
} from '@/types/models';

/**
 * Promos, referrals and payment methods — `API Rakeb.md` §11 & §12.
 *
 * Not implemented (add here):
 *   GET /me/referral · POST /referrals/claim
 */

const MOBILE_MONEY_LABEL: Record<string, string> = {
  d17: 'D17',
  e_dinar: 'e-DINAR',
  flouci: 'Flouci',
};

function methodLabel(dto: PaymentMethodResponse): string {
  if (dto.label) return dto.label;
  if (dto.type === 'card') return `Carte ${dto.brand ?? ''} •••• ${dto.last4 ?? ''}`.trim();
  if (dto.type === 'mobile_money') {
    const provider = dto.provider ? (MOBILE_MONEY_LABEL[dto.provider] ?? dto.provider) : 'Mobile money';
    return `${provider} · ${dto.msisdn ?? ''}`.trim();
  }
  if (dto.type === 'cash') return 'Espèces au conducteur';
  if (dto.type === 'wallet') return 'Portefeuille Rakeb';
  return dto.type;
}

function methodDetail(dto: PaymentMethodResponse): string | null {
  if (dto.type === 'card' && dto.last4) return 'Débitée à l’acceptation';
  if (dto.type === 'mobile_money' && dto.msisdn) return dto.msisdn;
  if (dto.type === 'cash') return 'À la montée, prévoyez l’appoint';
  return null;
}

function toPaymentMethod(dto: PaymentMethodResponse): PaymentMethod {
  const kind = dto.type as PaymentMethodKind;
  return {
    id: dto.id,
    kind,
    label: methodLabel(dto),
    detail: methodDetail(dto),
    is_default: dto.is_default,
    builtin: kind === 'cash' || kind === 'wallet',
  };
}

/**
 * `GET /promos/banners` — the home-screen promo strip.
 *
 * `action_url` is a `rakeb://` deep link on the wire; the strip navigates with
 * the router, so anything that is not an in-app path becomes non-tappable
 * rather than a broken push.
 */
export async function getPromoBanners(options?: RequestOptions): Promise<PromoBanner[]> {
  const rows = await apiGet<PromoBannerResponse[]>('/promos/banners', undefined, options);
  return rows.map((dto) => ({
    id: dto.id,
    title: dto.title,
    subtitle: dto.subtitle,
    cta_route: dto.action_url && dto.action_url.startsWith('/') ? dto.action_url : null,
    image_url: dto.image_url,
  }));
}

/** `GET /payment-methods` — cards, mobile money, cash and the wallet. */
export async function getPaymentMethods(options?: RequestOptions): Promise<PaymentMethod[]> {
  const rows = await apiGet<PaymentMethodResponse[]>('/payment-methods', undefined, options);
  return rows.map(toPaymentMethod);
}

/**
 * `POST /payment-methods` — add a card.
 *
 * Takes a **PSP client token**, never a raw card number. A real build gets
 * the token from a PSP SDK or hosted field; against the dev `fake` PSP any
 * `tok_*` string is accepted.
 */
export async function addCard(
  input: { provider_token: string; label?: string; set_default?: boolean },
  options?: RequestOptions,
): Promise<PaymentMethod> {
  return toPaymentMethod(await apiPost<PaymentMethodResponse>('/payment-methods', input, options));
}

/** `POST /payment-methods/mobile` — D17 / e-DINAR / Flouci. */
export async function addMobileMoney(
  input: { provider: MobileMoneyProvider; msisdn: string; set_default?: boolean },
  options?: RequestOptions,
): Promise<PaymentMethod> {
  return toPaymentMethod(
    await apiPost<PaymentMethodResponse>('/payment-methods/mobile', input, options),
  );
}

/** `PATCH /payment-methods/{id}` — set as default or rename. */
export async function updatePaymentMethod(
  id: Id,
  input: { is_default?: boolean; label?: string },
  options?: RequestOptions,
): Promise<PaymentMethod> {
  return toPaymentMethod(
    await apiPatch<PaymentMethodResponse>(`/payment-methods/${id}`, input, options),
  );
}

/** `DELETE /payment-methods/{id}`. */
export function deletePaymentMethod(id: Id, options?: RequestOptions): Promise<void> {
  return apiDelete<void>(`/payment-methods/${id}`, options);
}

/**
 * `POST /promos/validate` — the authority on a discount.
 *
 * Never compute a discount client-side. A rejected code comes back as an
 * `ApiError` with `field: 'promo_code'`, which pairs with the form.
 */
export async function validatePromo(
  code: string,
  tripId: Id,
  seats: number,
  options?: RequestOptions,
): Promise<PromoValidation> {
  const dto = await apiPost<ValidatePromoResponse>(
    '/promos/validate',
    { code, trip_id: tripId, seats },
    options,
  );
  return { code: dto.code, discount: dto.discount, message: dto.label };
}
