import { z } from 'zod';

/** All fields optional — the backend keeps whatever is left blank. */
export const profileFormSchema = z.object({
  first_name: z.string().trim().max(80).optional(),
  last_name: z.string().trim().max(80).optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'E-mail invalide.'),
  birth_date: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Format attendu : AAAA-MM-JJ.'),
  bio: z.string().trim().max(500).optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
