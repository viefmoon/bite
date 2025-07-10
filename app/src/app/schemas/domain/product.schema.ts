import { z } from 'zod';
import { photoSchema } from './photo.schema';
import { productVariantSchema } from './product-variant.schema';
import { modifierGroupSchema } from './modifier-group.schema';

/**
 * Esquema Zod para validar un objeto Product completo.
 * Fuente de verdad centralizada.
 */
export const productSchema = z.object({
  id: z.string(), // ID es requerido en el dominio
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().nullable().optional(), // Campo descripción agregado
  price: z
    .number()
    .positive('El precio debe ser positivo')
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(String(val)), {
      message: 'El precio debe tener como máximo dos decimales',
    })
    .optional()
    .nullable(),
  hasVariants: z.boolean(),
  isActive: z.boolean(),
  isPizza: z.boolean(),
  subcategoryId: z.string().min(1, 'La subcategoría es requerida'),
  sortOrder: z.number(),
  photo: photoSchema.optional().nullable(),
  estimatedPrepTime: z
    .number()
    .min(1, 'El tiempo debe ser al menos 1 minuto')
    .optional(),
  preparationScreenId: z.string().optional().nullable(),
  variants: z.array(productVariantSchema).optional(),
  modifierGroups: z.array(modifierGroupSchema).optional(),
  pizzaCustomizations: z.array(z.any()).optional(),
  pizzaConfiguration: z.any().optional(),
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export type Product = z.infer<typeof productSchema> & {
  pizzaCustomizations?: any[];
  pizzaConfiguration?: any;
};
