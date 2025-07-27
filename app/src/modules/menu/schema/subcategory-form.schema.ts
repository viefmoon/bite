import { z } from 'zod';
import { subCategorySchema } from '@/app/schemas/domain/subcategory.schema';
import { baseListQuerySchema } from '@/app/types/query.types';

// Esquema para el formulario de CREACIÓN
export const createSubCategoryDtoSchema = subCategorySchema
  .pick({
    name: true,
    description: true,
    isActive: true,
    categoryId: true,
    sortOrder: true,
  })
  .extend({
    // Validaciones específicas del formulario
    name: z.string().min(1, 'El nombre es requerido'),
    categoryId: z.string().min(1, 'Debe seleccionar una categoría válida'),
    isActive: z.boolean().default(true),
    sortOrder: z.number().default(0),
    photoId: z.union([z.string().uuid(), z.null(), z.undefined()]).optional(),
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

// Esquema para el formulario de ACTUALIZACIÓN
export const updateSubCategoryDtoSchema = createSubCategoryDtoSchema.partial();
export type UpdateSubCategoryDto = z.infer<typeof updateSubCategoryDtoSchema>;

// Esquema para filtros de búsqueda
export const findAllSubcategoriesDtoSchema = baseListQuerySchema.extend({
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type FindAllSubcategoriesDto = z.infer<
  typeof findAllSubcategoriesDtoSchema
>;

// Tipos de formulario para mantener compatibilidad
export type SubCategoryFormInputs = CreateSubCategoryDto;
export type UpdateSubCategoryFormInputs = UpdateSubCategoryDto;
