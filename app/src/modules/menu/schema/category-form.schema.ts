import { z } from 'zod';
import { categorySchema } from '@/app/schemas/domain/category.schema';

// Esquema para el formulario de CREACIÓN
export const createCategoryDtoSchema = categorySchema
  .pick({
    name: true,
    description: true,
    isActive: true,
    sortOrder: true,
  })
  .extend({
    // Validaciones específicas del formulario
    name: z.string().min(1, 'El nombre es requerido'),
    isActive: z.boolean().default(true),
    sortOrder: z.number().default(0),
    photoId: z.union([z.string().uuid(), z.null(), z.undefined()]).optional(),
  });

export type CreateCategoryDto = z.infer<typeof createCategoryDtoSchema>;

// Esquema para el formulario de ACTUALIZACIÓN
export const updateCategoryDtoSchema = createCategoryDtoSchema.partial();
export type UpdateCategoryDto = z.infer<typeof updateCategoryDtoSchema>;

// Esquema específico para formularios con manejo de imágenes
export const categoryFormSchema = createCategoryDtoSchema
  .extend({
    sortOrder: z.number().optional().default(0),
    imageUri: z
      .union([
        z.string().url(),
        z.string().startsWith('file://'),
        z.string().startsWith('http://'),
        z.string().startsWith('https://'),
        z.null(),
      ])
      .optional(),
  })
  .omit({ photoId: true })
  .transform((data) => ({
    ...data,
    sortOrder: data.sortOrder ?? 0,
  }));

export type CategoryFormData = z.infer<typeof categoryFormSchema>;
