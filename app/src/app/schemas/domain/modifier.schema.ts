import { z } from 'zod';

/**
 * Esquema Zod para validar un objeto Modifier completo.
 * Fuente de verdad centralizada.
 */
export const modifierSchema = z.object({
  id: z.string(),
  modifierGroupId: z.string().min(1, 'El ID del grupo no es válido'),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().max(255).nullable().optional(),
  price: z.coerce.number().nullable().optional(),
  sortOrder: z.number().int().default(0),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

// Tipo TypeScript inferido y exportado centralmente
export type Modifier = z.infer<typeof modifierSchema>;
