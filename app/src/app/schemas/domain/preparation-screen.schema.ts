import { z } from 'zod';

/**
 * Esquema Zod para PreparationScreen simplificado para el dominio.
 * Solo incluye los campos necesarios para la referencia en productos.
 */
export const preparationScreenSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
});

export type PreparationScreen = z.infer<typeof preparationScreenSchema>;