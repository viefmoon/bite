import { z } from 'zod';
import { baseListQuerySchema } from '../../../app/types/query.types';
import { productVariantSchema } from '../../../app/schemas/domain/product-variant.schema';
import { productSchema as domainProductSchema } from '../../../app/schemas/domain/product.schema';
const productVariantFormSchema = productVariantSchema
  .omit({ id: true })
  .extend({
    id: z.string().optional(),
    sortOrder: z.number().optional().default(0),
  });

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

export const productSchema = productFormBaseSchema.superRefine((data, ctx) =>
  addVariantValidation(data, ctx, false),
);

export type ProductFormInputs = z.infer<typeof productSchema>;

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

export const updateProductSchema = productFormBaseSchema
  .partial()
  .superRefine((data, ctx) => addVariantValidation(data, ctx, true));

export type UpdateProductFormInputs = z.infer<typeof updateProductSchema>;

export const productResponseSchema = domainProductSchema;
export const productsListResponseSchema = z.tuple([
  z.array(productResponseSchema), // Usa el schema de respuesta definido arriba
  z.number(), // Count
]);
export type ProductsListResponse = z.infer<typeof productsListResponseSchema>;

export const findAllProductsQuerySchema = baseListQuerySchema.extend({
  subcategoryId: z.string().optional(),
  hasVariants: z.boolean().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});
export type FindAllProductsQuery = z.infer<typeof findAllProductsQuerySchema>;

export const assignModifierGroupsSchema = z.object({
  modifierGroupIds: z
    .array(z.string())
    .min(1, 'Se requiere al menos un ID de grupo'),
});
export type AssignModifierGroupsInput = z.infer<
  typeof assignModifierGroupsSchema
>;
