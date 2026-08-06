import { z } from 'zod';

/**
 * Form schemas for the auth flow.
 *
 * These validate *shape* only — that a phone number could exist and a code has
 * six digits. Whether the number is reachable and the code is correct is the
 * server's answer, returned as an `ApiError` with a `field`, which the form
 * surfaces through `setError`.
 */

/** Tunisian mobile numbers: 8 digits starting with 2, 4, 5 or 9, optional +216. */
const TUNISIAN_PHONE = /^(?:\+216)?[2459]\d{7}$/;

export const phoneFormSchema = z.object({
  phone: z.string().trim().regex(TUNISIAN_PHONE, 'Entrez un numéro de téléphone tunisien valide.'),
});

export type PhoneFormValues = z.infer<typeof phoneFormSchema>;

export const otpFormSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Le code contient 6 chiffres.'),
});

export type OtpFormValues = z.infer<typeof otpFormSchema>;

/** Normalizes user input to the E.164 form the API expects. */
export function toE164(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.startsWith('+') ? digits : `+216${digits}`;
}
