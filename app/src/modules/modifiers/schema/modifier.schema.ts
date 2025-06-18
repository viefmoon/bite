import { z } from 'zod';
import { modifierSchema as domainModifierSchema } from '../../../app/schemas/domain/modifier.schema';
import type { Modifier } from '../../../app/schemas/domain/modifier.schema';

// Schema para DTO de creación (definido manualmente, sin id)
export const createModifierSchema = z.object({
  modifierGroupId: z.string().min(1, 'El ID del grupo no es válido'),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().max(255).nullable().optional(),
  price: z.coerce.number().nullable().optional(),
  sortOrder: z.number().int().default(0),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type CreateModifierInput = z.infer<typeof createModifierSchema>;

// Schema para DTO de actualización (parcial, sin id ni modifierGroupId)
export const updateModifierSchema = z
  .object({
    name: z.string().min(1, 'El nombre es requerido').max(100),
    description: z.string().max(255).nullable().optional(),
    price: z.coerce.number().nullable().optional(),
    sortOrder: z.number().int().default(0),
    isDefault: z.boolean().default(false),
    isActive: z.boolean().default(true),
  })
  .partial();
export type UpdateModifierInput = z.infer<typeof updateModifierSchema>;

// Schema específico para validación del formulario (puede tener reglas diferentes a los DTOs)
export const modifierFormValidationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().max(255).nullable().optional(),
  // Usar z.preprocess para manejar strings vacíos o null antes de coercer a número
  price: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.coerce.number().nullable().optional(),
  ),
  sortOrder: z.preprocess(
    (val) => (val === '' || val === null ? 0 : val),
    z.coerce.number().int().optional().default(0),
  ),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

// Schema para la respuesta de la API (extiende el schema de dominio)
export const modifierApiSchema = domainModifierSchema.extend({
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
});

// Re-exportar el tipo de dominio centralizado
export type { Modifier };
