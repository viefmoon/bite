import { z } from 'zod';
// Importar el tipo central
import type { Area } from '../../../app/schemas/domain/area.schema';

// Schema base para área con campos comunes
const areaBaseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Schema para crear área - derivado del base con valores por defecto
export const CreateAreaSchema = areaBaseSchema.extend({
  isActive: z.boolean().optional().default(true),
});

// Schema para actualizar área - derivado del base con todos los campos opcionales
export const UpdateAreaSchema = areaBaseSchema.partial();

export type CreateAreaDto = z.infer<typeof CreateAreaSchema>;
export type UpdateAreaDto = z.infer<typeof UpdateAreaSchema>;

// Schema para filtros de búsqueda - derivado con campos específicos
export const FindAllAreasSchema = areaBaseSchema
  .pick({ name: true, isActive: true })
  .partial();

export type FindAllAreasDto = z.infer<typeof FindAllAreasSchema>;

// Re-exportar el tipo de dominio si es conveniente para el módulo
export type { Area };
