import { z } from 'zod';
import { baseListQuerySchema } from '../../../app/types/query.types';

const subCategoryBaseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
  categoryId: z.string().min(1, 'Debe seleccionar una categoría válida'),
  photoId: z.union([z.string().uuid(), z.null(), z.undefined()]).optional(),
  sortOrder: z.number(),
});

export const createSubCategoryDtoSchema = subCategoryBaseSchema.extend({
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  imageUri: z
    .union([
      z.string().url(),
      z.string().startsWith('file://'),
      z.string().startsWith('http://'),
      z.string().startsWith('https://'),
      z.null(),
    ])
    .optional(),
});
export type CreateSubCategoryDto = z.infer<typeof createSubCategoryDtoSchema>;

export const updateSubCategoryDtoSchema = subCategoryBaseSchema
  .partial()
  .extend({
    imageUri: z
      .union([
        z.string().url(),
        z.string().startsWith('file://'),
        z.string().startsWith('http://'),
        z.string().startsWith('https://'),
        z.null(),
      ])
      .optional(),
  });
export type UpdateSubCategoryDto = z.infer<typeof updateSubCategoryDtoSchema>;

export const findAllSubcategoriesDtoSchema = baseListQuerySchema.extend({
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type FindAllSubcategoriesDto = z.infer<
  typeof findAllSubcategoriesDtoSchema
>;

export type SubCategoryFormInputs = CreateSubCategoryDto;
export type UpdateSubCategoryFormInputs = UpdateSubCategoryDto;
