import { z } from 'zod';

/**
 * Esquema Zod para validar la estructura de una foto en el dominio.
 * Fuente de verdad centralizada.
 */
export const photoSchema = z.object({
  id: z.string().uuid(), // ID puede ser custom format
  path: z.string().url(), // Usar url() como en products/subcategories
});

// Tipo TypeScript inferido y exportado centralmente
export type Photo = z.infer<typeof photoSchema>;
