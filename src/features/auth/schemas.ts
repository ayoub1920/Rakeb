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

const EMAIL = z.string().trim().toLowerCase().email('Adresse email invalide.');

/** Matches the backend's `@Length(1, 80)` on `first_name` / `last_name`. */
const NAME = z
  .string()
  .trim()
  .min(1, 'Champ requis.')
  .max(80, '80 caractères maximum.');

export const registerFormSchema = z.object({
  firstName: NAME,
  lastName: NAME,
  email: EMAIL,
  password: z.string().min(8, '8 caractères minimum.'),
  marketingOptIn: z.boolean(),
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const loginFormSchema = z.object({
  email: EMAIL,
  password: z.string().min(1, 'Mot de passe requis.'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const forgotPasswordFormSchema = z.object({
  email: EMAIL,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export type PasswordStrength = 'weak' | 'medium' | 'strong';

/**
 * Coarse client-side signal only — never a substitute for the server's own
 * password policy, which is the one that actually gets enforced.
 */
export function getPasswordStrength(password: string): PasswordStrength {
  const varietyCount = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) =>
    pattern.test(password),
  ).length;

  if (password.length >= 10 && varietyCount >= 3) return 'strong';
  if (password.length >= 8 && varietyCount >= 2) return 'medium';
  return 'weak';
}
