import { z } from 'zod';

/**
 * Esquema Zod para validar un objeto ProductVariant completo.
 * Fuente de verdad centralizada.
 */
export const productVariantSchema = z.object({
  id: z.string(), // ID es requerido en el dominio
  name: z.string().min(1, 'El nombre es requerido'),
  price: z.number({
    invalid_type_error: 'El precio debe ser un número',
    required_error: 'El precio es requerido',
  }), // No necesita ser positivo aquí, puede ser 0
  isActive: z.boolean(),
  sortOrder: z.number(),
});

// Tipo TypeScript inferido y exportado centralmente
export type ProductVariant = z.infer<typeof productVariantSchema>;
