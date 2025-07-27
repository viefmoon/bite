import { z } from 'zod';

/**
 * Esquema Zod para validar un objeto ModifierGroup completo.
 * Fuente de verdad centralizada.
 */
export const modifierGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().nullable().optional(),
  minSelections: z.number().int().min(0).default(0), // Backend: default 0
  maxSelections: z.number().int().min(1), // REQUIRED en backend
  isRequired: z.boolean().default(false),
  allowMultipleSelections: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(),
  deletedAt: z.union([z.string().datetime(), z.date()]).nullable().optional(),
  // Relaciones del backend
  productModifiers: z.array(z.any()).optional(), // ProductModifierEntity[]
  products: z.array(z.any()).optional(), // ProductEntity[]
});

// Tipo TypeScript inferido y exportado centralmente
export type ModifierGroup = z.infer<typeof modifierGroupSchema>;
