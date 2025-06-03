import { z } from "zod";

/**
 * Esquema Zod para validar la estructura de una foto de categoría.
 * Fuente de verdad centralizada.
 */
export const categoryPhotoSchema = z.object({
  id: z.string(), // Asumiendo que el ID puede no ser UUID aquí, ajustar si es necesario
  path: z.string(), // Podría ser z.string().url() si siempre es URL
});

/**
 * Esquema Zod para validar un objeto Category completo.
 * Fuente de verdad centralizada.
 */
export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
  photo: categoryPhotoSchema.nullable().optional(),
});

// Tipos TypeScript inferidos y exportados centralmente
export type CategoryPhoto = z.infer<typeof categoryPhotoSchema>;
export type Category = z.infer<typeof categorySchema>;