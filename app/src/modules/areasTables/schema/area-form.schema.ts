import { z } from 'zod';
import { areaSchema } from '@/app/schemas/domain/area.schema';

// Esquema para el formulario de CREACIÓN
// Se omiten campos autogenerados como 'id', 'createdAt', 'updatedAt', 'deletedAt', 'tables'
export const CreateAreaSchema = areaSchema
  .pick({
    name: true,
    description: true,
    isActive: true,
  })
  .extend({
    // Validaciones específicas del formulario
    name: z.string().min(1, 'El nombre del área es obligatorio.'),
    description: z.string().optional(), // Actualizado: opcional como en dominio
    isActive: z.boolean().optional().default(true),
  });

export type CreateAreaDto = z.infer<typeof CreateAreaSchema>;

// Esquema para el formulario de ACTUALIZACIÓN
// Se usa .partial() para hacer todos los campos opcionales
export const UpdateAreaSchema = CreateAreaSchema.partial();
export type UpdateAreaDto = z.infer<typeof UpdateAreaSchema>;

// Esquema para filtros de búsqueda
export const FindAllAreasSchema = areaSchema
  .pick({ name: true, isActive: true })
  .partial();

export type FindAllAreasDto = z.infer<typeof FindAllAreasSchema>;
