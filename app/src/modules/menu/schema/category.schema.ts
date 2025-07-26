import { z } from 'zod';
import type { Category } from '../../../app/schemas/domain/category.schema';
import { type Photo } from '../../../app/schemas/domain/photo.schema';

const categoryBaseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
  photoId: z.union([z.string().uuid(), z.null(), z.undefined()]).optional(),
  sortOrder: z.number().default(0),
});

export const createCategoryDtoSchema = categoryBaseSchema.extend({
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

export const updateCategoryDtoSchema = categoryBaseSchema.partial();

export const categoryFormSchema = categoryBaseSchema
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
export type CreateCategoryDto = z.infer<typeof createCategoryDtoSchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategoryDtoSchema>;
export type CategoryFormData = z.infer<typeof categoryFormSchema>;

export type { Category, Photo };
