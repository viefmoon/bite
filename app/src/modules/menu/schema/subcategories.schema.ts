import { z } from "zod";
import { baseListQuerySchema } from "../../../app/types/api.types";
import { type Photo } from "../../../app/schemas/domain/photo.schema"; // Eliminado photoSchema no usado
import type { SubCategory } from "../../../app/schemas/domain/subcategory.schema";

export const createSubCategoryDtoSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  categoryId: z.string().uuid("Debe seleccionar una categoría válida"),
  photoId: z.string().uuid().optional().nullable(),
  imageUri: z.string().nullable().optional(),
});
export type CreateSubCategoryDto = z.infer<typeof createSubCategoryDtoSchema>;

export const updateSubCategoryDtoSchema = createSubCategoryDtoSchema.partial().extend({
    photoId: z.string().uuid().nullable().optional(),
    imageUri: z.string().nullable().optional(),
});
export type UpdateSubCategoryDto = z.infer<typeof updateSubCategoryDtoSchema>;


export const findAllSubcategoriesDtoSchema = baseListQuerySchema.extend({
  categoryId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

export type SubCategoryFormInputs = CreateSubCategoryDto;
export type UpdateSubCategoryFormInputs = UpdateSubCategoryDto;

export type { Photo, SubCategory };
