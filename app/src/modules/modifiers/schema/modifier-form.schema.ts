import { z } from 'zod';
import { modifierSchema } from '@/app/schemas/domain/modifier.schema';

// Esquema para el formulario de CREACIÓN
export const createModifierSchema = modifierSchema
  .pick({
    modifierGroupId: true,
    name: true,
    description: true,
    price: true,
    sortOrder: true,
    isDefault: true,
    isActive: true,
  })
  .extend({
    // Validaciones específicas del formulario
    name: z.string().min(1, 'El nombre es requerido').max(100),
    modifierGroupId: z.string().min(1, 'El ID del grupo no es válido'),
    sortOrder: z.number().int().default(0),
    isDefault: z.boolean().default(false),
    isActive: z.boolean().default(true),
  });

export type CreateModifierInput = z.infer<typeof createModifierSchema>;

// Esquema para el formulario de ACTUALIZACIÓN
export const updateModifierSchema = createModifierSchema
  .omit({ modifierGroupId: true })
  .partial();

export type UpdateModifierInput = z.infer<typeof updateModifierSchema>;

// Esquema específico para validación de formularios con preprocessing
export const modifierFormValidationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().max(255).nullable().optional(),
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

// Esquema para respuestas de API
export const modifierApiSchema = modifierSchema.extend({
  price: z.number().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
});

// Tipo específico para formularios
export type ModifierFormInputs = {
  name: string;
  description?: string | null;
  price?: number | null;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
};
