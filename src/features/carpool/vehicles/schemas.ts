import { z } from 'zod';

/**
 * Tunisian civilian plate: `<1-3 digits> TU <1-4 digits>`, e.g. `204 TU 3456`.
 * Spaces are optional on input; the server is the authority on duplicates.
 */
export const TUNISIAN_PLATE = /^\s*\d{1,3}\s*(TU|tu)\s*\d{1,4}\s*$/;

export const vehicleFormSchema = z.object({
  make: z.string().trim().min(1, 'Indiquez la marque.').max(40),
  model: z.string().trim().min(1, 'Indiquez le modèle.').max(40),
  color: z.string().trim().min(1, 'Indiquez la couleur.').max(30),
  plate: z
    .string()
    .trim()
    .regex(TUNISIAN_PLATE, 'Format attendu : 204 TU 3456.'),
  year: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || /^\d{4}$/.test(value),
      'Année sur 4 chiffres, ou laissez vide.',
    ),
  seats: z.number().int().min(1, 'Au moins une place.').max(8),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

/** Normalises `204tu3456`, `204 TU 3456` → `204 TU 3456`. */
export function normalisePlate(input: string): string {
  const match = input
    .trim()
    .toUpperCase()
    .match(/^(\d{1,3})\s*TU\s*(\d{1,4})$/);
  return match ? `${match[1]} TU ${match[2]}` : input.trim().toUpperCase();
}
