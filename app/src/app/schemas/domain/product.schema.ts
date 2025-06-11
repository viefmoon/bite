import { z } from 'zod';
import { photoSchema } from './photo.schema';
import { productVariantSchema } from './product-variant.schema';
import { modifierGroupSchema } from './modifier-group.schema'; // Usar el schema centralizado

/**
 * Esquema Zod para validar un objeto Product completo.
 * Fuente de verdad centralizada.
 */
export const productSchema = z.object({
  id: z.string().uuid(), // ID es requerido en el dominio
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
  subcategoryId: z.string().uuid('La subcategoría es requerida'),
  photo: photoSchema.optional().nullable(), // Usar schema centralizado
  estimatedPrepTime: z
    .number()
    .min(1, 'El tiempo debe ser al menos 1 minuto')
    .optional(),
  preparationScreenId: z.string().uuid().optional().nullable(),
  variants: z.array(productVariantSchema).optional(), // Usar schema centralizado
  modifierGroups: z.array(modifierGroupSchema).optional(), // Usar schema centralizado
  createdAt: z.union([z.string().datetime(), z.date()]).optional(), // Incluido desde la interfaz original
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(), // Incluido desde la interfaz original
});

// Tipo TypeScript inferido y exportado centralmente
export type Product = z.infer<typeof productSchema>;
