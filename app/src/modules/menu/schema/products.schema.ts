import { z } from 'zod';
import { baseListQuerySchema } from '../../../app/types/query.types';
// Importar tipos de dominio centralizados
import {
  photoSchema,
  type Photo,
} from '../../../app/schemas/domain/photo.schema';
import {
  productVariantSchema,
  type ProductVariant,
} from '../../../app/schemas/domain/product-variant.schema';
import { modifierGroupSchema } from '../../../app/schemas/domain/modifier-group.schema';
// Importar el schema y tipo Product centralizado del dominio
import {
  productSchema as domainProductSchema,
  type Product,
} from '../../../app/schemas/domain/product.schema';

// --- Schemas Zod ---

// Schema para variantes en el formulario - derivado del dominio sin ID requerido
const productVariantFormSchema = productVariantSchema
  .omit({ id: true })
  .extend({
    id: z.string().optional(),
    sortOrder: z.number().optional().default(0),
  });

// Schema base para productos con campos comunes del formulario
const productFormBaseSchema = domainProductSchema
  .omit({
    id: true,
    photo: true,
    variants: true,
    modifierGroups: true,
    pizzaCustomizations: true,
    pizzaConfiguration: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    id: z.string().optional(), // ID opcional para creación/formulario
    photoId: z.union([z.string().uuid(), z.null(), z.undefined()]).optional(), // ID de la foto guardada en backend
    imageUri: z // Campo temporal para el formulario
      .string()
      .url()
      .or(z.string().startsWith('file://'))
      .optional()
      .nullable(),
    variants: z.array(productVariantFormSchema).optional(), // Usa el schema del formulario
    variantsToDelete: z.array(z.string()).optional(), // Para manejar eliminación en edición
    modifierGroupIds: z.array(z.string()).optional(), // IDs para asignar/actualizar
  });

// Schema de creación/formulario - derivado del base con validación condicional
export const productSchema = productFormBaseSchema.superRefine((data, ctx) =>
  addVariantValidation(data, ctx, false),
);

// Tipo inferido para los inputs del formulario
export type ProductFormInputs = z.infer<typeof productSchema>;

// Función helper para validación de variantes (reutilizable)
const addVariantValidation = (
  data: any,
  ctx: z.RefinementCtx,
  isPartial = false,
) => {
  const checkVariants = isPartial ? data.hasVariants !== undefined : true;

  if (checkVariants && data.hasVariants) {
    if (data.variants !== undefined && data.variants.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe añadir al menos una variante si marca esta opción.',
        path: ['variants'],
      });
    }
    if (data.price !== null && data.price !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'El precio principal debe estar vacío si el producto tiene variantes.',
        path: ['price'],
      });
    }
  } else if (checkVariants && data.hasVariants === false) {
    if (data.price === null || data.price === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El precio es requerido si el producto no tiene variantes.',
        path: ['price'],
      });
    }
    if (data.variants && data.variants.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'No debe haber variantes si el producto no está marcado como "Tiene Variantes".',
        path: ['variants'],
      });
    }
  }
};

// Schema para actualización - derivado del base parcial con validación reutilizada
export const updateProductSchema = productFormBaseSchema
  .partial()
  .superRefine((data, ctx) => addVariantValidation(data, ctx, true));

export type UpdateProductFormInputs = z.infer<typeof updateProductSchema>;

// Esquema para la respuesta de la API - usa directamente el schema de dominio
// Este schema representa la estructura que devuelve el backend.
export const productResponseSchema = domainProductSchema;

// Esquema para la respuesta de lista paginada (si aplica)
export const productsListResponseSchema = z.tuple([
  z.array(productResponseSchema), // Usa el schema de respuesta definido arriba
  z.number(), // Count
]);
export type ProductsListResponse = z.infer<typeof productsListResponseSchema>;

// Esquema para los parámetros de query de búsqueda
export const findAllProductsQuerySchema = baseListQuerySchema.extend({
  subcategoryId: z.string().optional(),
  hasVariants: z.boolean().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});
export type FindAllProductsQuery = z.infer<typeof findAllProductsQuerySchema>;

// Esquema para asignar/desasignar grupos de modificadores
export const assignModifierGroupsSchema = z.object({
  modifierGroupIds: z
    .array(z.string())
    .min(1, 'Se requiere al menos un ID de grupo'),
});
export type AssignModifierGroupsInput = z.infer<
  typeof assignModifierGroupsSchema
>;

// Re-exportar los tipos de dominio centralizados
export type { Photo, ProductVariant, Product }; // Añadir Product
