import { z } from 'zod';
import { modifierGroupSchema as domainModifierGroupSchema } from '../../../app/schemas/domain/modifier-group.schema';

export const modifierGroupBaseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().nullable().optional(),
  minSelections: z.number().int().min(0).optional(),
  maxSelections: z.number().int().min(1).optional(),
  isRequired: z.boolean().optional(),
  allowMultipleSelections: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional().default(0),
});

export const modifierGroupFormValidationSchema =
  modifierGroupBaseSchema.superRefine((data, ctx) => {
    if (data.allowMultipleSelections) {
      if (data.maxSelections === undefined || data.maxSelections === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['maxSelections'],
          message:
            'Máx. selecciones es requerido si se permiten múltiples selecciones.',
        });
      } else {
        if (data.maxSelections <= 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['maxSelections'],
            message:
              'Máx. selecciones debe ser mayor que 1 si se permiten múltiples selecciones.',
          });
        }

        const min = data.minSelections ?? 0;
        if (data.maxSelections > 1 && min > data.maxSelections) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['minSelections'],
            message:
              'Mín. selecciones no puede ser mayor que Máx. selecciones.',
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['maxSelections'],
            message:
              'Máx. selecciones no puede ser menor que Mín. selecciones.',
          });
        }
      }
    }
  });

export type ModifierGroupFormInputs = z.infer<
  typeof modifierGroupFormValidationSchema
>;

export const createModifierGroupSchema = modifierGroupBaseSchema.transform(
  (data) => ({
    ...data,
    minSelections: data.minSelections ?? 0,
    isRequired: data.isRequired ?? false,
    allowMultipleSelections: data.allowMultipleSelections ?? false,
    isActive: data.isActive ?? true,
    sortOrder: data.sortOrder ?? 0,
    maxSelections: data.allowMultipleSelections ? (data.maxSelections ?? 1) : 1,
  }),
);

export type CreateModifierGroupInput = z.infer<
  typeof createModifierGroupSchema
>;

export const updateModifierGroupSchema = modifierGroupBaseSchema.partial();

export type UpdateModifierGroupInput = z.infer<
  typeof updateModifierGroupSchema
>;

export const modifierGroupApiSchema = domainModifierGroupSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
  productModifiers: z.array(z.any()).optional(),
  products: z.array(z.any()).optional(),
});


export const modifierGroupSchema = modifierGroupFormValidationSchema;
