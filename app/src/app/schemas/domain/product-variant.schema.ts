import { z } from "zod";

/**
 * Esquema Zod para validar un objeto ProductVariant completo.
 * Fuente de verdad centralizada.
 */
export const productVariantSchema = z.object({
  id: z.string().uuid(), // ID es requerido en el dominio
  name: z.string().min(1, "El nombre es requerido"),
  price: z.coerce.number({ // Usar coerce para asegurar que sea número
    invalid_type_error: "El precio debe ser un número",
    required_error: "El precio es requerido",
  }), // No necesita ser positivo aquí, puede ser 0
  isActive: z.boolean(),
});

// Tipo TypeScript inferido y exportado centralmente
export type ProductVariant = z.infer<typeof productVariantSchema>;

// Schema opcional para Input (definido manualmente, sin ID)
export const productVariantInputSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  price: z.coerce.number({
    invalid_type_error: "El precio debe ser un número",
    required_error: "El precio es requerido",
  }),
  isActive: z.boolean(),
});
export type ProductVariantInput = z.infer<typeof productVariantInputSchema>;