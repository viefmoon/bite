import { z } from 'zod';
import { modifierGroupSchema } from '@/app/schemas/domain/modifier-group.schema';

// Esquema base para formularios
export const modifierGroupBaseSchema = modifierGroupSchema
  .pick({
    name: true,
    description: true,
    minSelections: true,
    maxSelections: true,
    isRequired: true,
    allowMultipleSelections: true,
    isActive: true,
    sortOrder: true,
  })
  .extend({
    // Validaciones específicas del formulario
    name: z.string().min(1, 'El nombre es requerido'),
    sortOrder: z.number().optional().default(0),
  });

// Esquema con validaciones complejas para formularios
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

// Esquema para creación con valores por defecto
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

// Esquema para actualización
export const updateModifierGroupSchema = modifierGroupBaseSchema.partial();
export type UpdateModifierGroupInput = z.infer<
  typeof updateModifierGroupSchema
>;

// Esquema para respuestas de API
export const modifierGroupApiSchema = modifierGroupSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
  productModifiers: z
    .array(
      z.lazy(() =>
        z.object({
          id: z.string(),
          modifierGroupId: z.string(),
          name: z.string(),
          price: z.number(),
          isActive: z.boolean(),
          sortOrder: z.number(),
        }),
      ),
    )
    .optional(),
  products: z
    .array(
      z.lazy(() =>
        z.object({
          id: z.string(),
          name: z.string(),
          price: z.number().nullable().optional(),
          hasVariants: z.boolean(),
          isActive: z.boolean(),
          isPizza: z.boolean(),
          subcategoryId: z.string(),
          sortOrder: z.number(),
          estimatedPrepTime: z.number(),
        }),
      ),
    )
    .optional(),
});

// Exportar el esquema de formulario con un nombre específico
export { modifierGroupFormValidationSchema as modifierGroupFormSchema };
