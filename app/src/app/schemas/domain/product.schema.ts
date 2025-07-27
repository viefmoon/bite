import { z } from 'zod';
import { photoSchema } from './photo.schema';
import { productVariantSchema } from './product-variant.schema';
import { modifierGroupSchema } from './modifier-group.schema';
import { preparationScreenSchema } from './preparation-screen.schema';
import { selectedPizzaCustomizationSchema } from '@/modules/pizzaCustomizations/schema/pizzaCustomization.schema';
import { pizzaConfigurationSchema } from '@/modules/pizzaCustomizations/schema/pizzaConfiguration.schema';

/**
 * Esquema Zod para validar un objeto Product completo.
 * Fuente de verdad centralizada.
 */
export const productSchema = z.object({
  id: z.string(), // ID es requerido en el dominio
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().nullable().optional(), // Campo descripción agregado
  price: z.coerce
    .number()
    .positive('El precio debe ser positivo')
    .multipleOf(0.01, 'El precio debe tener como máximo dos decimales')
    .optional()
    .nullable(),
  hasVariants: z.boolean(),
  isActive: z.boolean(),
  isPizza: z.boolean(),
  subcategoryId: z.string().min(1, 'La subcategoría es requerida'),
  sortOrder: z.number(),
  photo: photoSchema.optional().nullable(),
  photoId: z.string().nullable().optional(), // Campo directo del backend
  estimatedPrepTime: z.number().min(1, 'El tiempo debe ser al menos 1 minuto'), // REQUIRED en backend
  preparationScreenId: z.string().optional().nullable(),
  preparationScreen: preparationScreenSchema.optional().nullable(),
  variants: z.array(productVariantSchema).optional(),
  modifierGroups: z.array(modifierGroupSchema).optional(),
  pizzaCustomizations: z.array(selectedPizzaCustomizationSchema).optional(),
  pizzaConfiguration: pizzaConfigurationSchema.optional().nullable(),
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(),
  deletedAt: z.union([z.string().datetime(), z.date()]).nullable().optional(),
  // Relaciones adicionales del backend
  subcategory: z.any().optional(), // SubcategoryEntity
  orderItems: z.array(z.any()).optional(), // OrderItemEntity[]
});

export type Product = z.infer<typeof productSchema>;
