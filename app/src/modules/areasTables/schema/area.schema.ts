import { z } from 'zod';
const areaBaseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const CreateAreaSchema = areaBaseSchema.extend({
  isActive: z.boolean().optional().default(true),
});

export const UpdateAreaSchema = areaBaseSchema.partial();

export type CreateAreaDto = z.infer<typeof CreateAreaSchema>;
export type UpdateAreaDto = z.infer<typeof UpdateAreaSchema>;

export const FindAllAreasSchema = areaBaseSchema
  .pick({ name: true, isActive: true })
  .partial();

export type FindAllAreasDto = z.infer<typeof FindAllAreasSchema>;

