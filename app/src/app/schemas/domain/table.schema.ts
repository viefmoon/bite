import { z } from 'zod';

/**
 * Esquema Zod para validar un objeto Table completo.
 * Fuente de verdad centralizada.
 */
export const tableSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  areaId: z.string().uuid(),
  capacity: z.number().int().nullable().optional(),
  isActive: z.boolean(),
  isAvailable: z.boolean(), // Incluido desde el schema original
  isTemporary: z.boolean(), // Incluido desde el schema original
  temporaryIdentifier: z.string().nullable().optional(), // Incluido desde el schema original
  createdAt: z.union([z.string().datetime(), z.date()]).optional(), // Permitir string o Date
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(), // Permitir string o Date
});

// Tipo TypeScript inferido y exportado centralmente
export type Table = z.infer<typeof tableSchema>;
