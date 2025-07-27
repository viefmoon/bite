import { z } from 'zod';
import { modifierSchema as domainModifierSchema } from '../../../app/schemas/domain/modifier.schema';

const modifierBaseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().max(255).nullable().optional(),
  price: z.coerce.number().nullable().optional(),
  sortOrder: z.number().int(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

export const createModifierSchema = modifierBaseSchema.extend({
  modifierGroupId: z.string().min(1, 'El ID del grupo no es válido'),
  sortOrder: z.number().int().default(0),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type CreateModifierInput = z.infer<typeof createModifierSchema>;

export const updateModifierSchema = modifierBaseSchema.partial();
export type UpdateModifierInput = z.infer<typeof updateModifierSchema>;

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

export const modifierApiSchema = domainModifierSchema.extend({
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
});


export type ModifierFormInputs = {
  name: string;
  description?: string | null;
  price?: number | null;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
};
