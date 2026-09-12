import { z } from 'zod';

/**
 * Tunisian civilian plate — copied from `features/carpool/vehicles/schemas.ts`
 * on purpose (not imported: taxi must not depend on carpool).
 */
export const TUNISIAN_PLATE = /^\s*\d{1,3}\s*(TU|tu)\s*\d{1,4}\s*$/;

/** Normalises `204tu3456`, `204 TU 3456` → `204 TU 3456`. */
export function normaliseTaxiPlate(input: string): string {
  const match = input
    .trim()
    .toUpperCase()
    .match(/^(\d{1,3})\s*TU\s*(\d{1,4})$/);
  return match ? `${match[1]} TU ${match[2]}` : input.trim().toUpperCase();
}

const uploadIdSchema = z.string().min(1, 'Document requis.');

export const taxiApplicationSchema = z.object({
  plate_number: z.string().trim().regex(TUNISIAN_PLATE, 'Format attendu : 204 TU 3456.'),
  licence_front_upload_id: uploadIdSchema,
  licence_back_upload_id: z.string().optional(),
  cin_front_upload_id: uploadIdSchema,
  cin_back_upload_id: z.string().optional(),
  driver_photo_upload_id: uploadIdSchema,
  vehicle_photo_upload_id: uploadIdSchema,
});

export type TaxiApplicationFormValues = z.infer<typeof taxiApplicationSchema>;

export const taxiRideRequestSchema = z
  .object({
    pickup_label: z.string().trim().min(1, 'Choisissez un point de prise en charge.'),
    pickup: z.object({ lat: z.number(), lng: z.number() }),
    destination_label: z.string().trim().min(1, 'Choisissez une destination.'),
    destination: z.object({ lat: z.number(), lng: z.number() }),
  })
  .refine(
    (value) =>
      Math.abs(value.pickup.lat - value.destination.lat) > 0.0005 ||
      Math.abs(value.pickup.lng - value.destination.lng) > 0.0005,
    { message: 'Le point de prise en charge et la destination sont identiques.', path: ['destination'] },
  );

export type TaxiRideRequestFormValues = z.infer<typeof taxiRideRequestSchema>;
