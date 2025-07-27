import { z } from 'zod';

/**
 * Esquema Zod para validar un objeto Modifier completo.
 * Fuente de verdad centralizada.
 */
export const modifierSchema = z.object({
  id: z.string(),
  modifierGroupId: z.string().min(1, 'El ID del grupo no es válido'),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().nullable().optional(), // Backend: varchar nullable
  price: z.number().nullable().optional(), // Backend: decimal nullable
  sortOrder: z.number().int().default(0),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(),
  deletedAt: z.union([z.string().datetime(), z.date()]).nullable().optional(),
  // Relación del backend (usando z.lazy para evitar dependencias circulares)
  modifierGroup: z
    .lazy(() =>
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().nullable().optional(),
        minSelections: z.number().int().min(0),
        maxSelections: z.number().int().min(1),
        isRequired: z.boolean(),
        allowMultipleSelections: z.boolean(),
        isActive: z.boolean(),
        sortOrder: z.number(),
      }),
    )
    .optional(),
});

// Tipo TypeScript inferido y exportado centralmente
export type Modifier = z.infer<typeof modifierSchema>;
