import { z } from 'zod';
import { baseListQuerySchema } from '../../../app/types/api.types';
import { type Photo } from '../../../app/schemas/domain/photo.schema'; // Eliminado photoSchema no usado
import type { SubCategory } from '../../../app/schemas/domain/subcategory.schema';

export const createSubCategoryDtoSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  categoryId: z.string().min(1, 'Debe seleccionar una categoría válida'),
  photoId: z.string().optional().nullable(),
  imageUri: z
    .union([
      z.string().url(),
      z.string().startsWith('file://'),
      z.string().startsWith('http://'),
      z.string().startsWith('https://'),
      z.null(),
    ])
    .optional(),
  sortOrder: z.number().optional().default(0),
});
export type CreateSubCategoryDto = z.infer<typeof createSubCategoryDtoSchema>;

export const updateSubCategoryDtoSchema = createSubCategoryDtoSchema.partial();
export type UpdateSubCategoryDto = z.infer<typeof updateSubCategoryDtoSchema>;

export const findAllSubcategoriesDtoSchema = baseListQuerySchema.extend({
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type SubCategoryFormInputs = CreateSubCategoryDto;
export type UpdateSubCategoryFormInputs = UpdateSubCategoryDto;

export type { Photo, SubCategory };
