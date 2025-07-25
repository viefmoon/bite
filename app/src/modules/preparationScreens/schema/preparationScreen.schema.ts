import { z } from 'zod';
// Importar el schema y tipo de dominio centralizado
import {
  preparationScreenSchema as domainPreparationScreenSchema,
  type PreparationScreen as DomainPreparationScreen,
} from '../../../app/schemas/domain/preparation-screen.schema';

// Esquema principal extendido desde el dominio para incluir relaciones
export const PreparationScreenSchema = domainPreparationScreenSchema.extend({
  id: z.string().uuid(), // Refinar el ID para ser UUID específicamente
  products: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    )
    .optional(),
  users: z
    .array(
      z.object({
        id: z.string(),
        username: z.string(),
        firstName: z.string().nullable().optional(),
        lastName: z.string().nullable().optional(),
      }),
    )
    .nullable()
    .optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// Esquema para crear una nueva pantalla de preparación - compuesto desde el dominio
export const CreatePreparationScreenSchema = domainPreparationScreenSchema
  .omit({ id: true })
  .extend({
    name: z
      .string()
      .min(1, 'El nombre es requerido')
      .max(100, 'El nombre no puede exceder los 100 caracteres'),
    description: z
      .string()
      .max(255, 'La descripción no puede exceder los 255 caracteres')
      .nullable()
      .optional(),
    isActive: z.boolean().optional().default(true),
    productIds: z.array(z.string().uuid()).optional(), // IDs de productos asociados (opcional)
    userId: z
      .string()
      .min(1, 'Debe seleccionar un usuario de cocina')
      .uuid({ message: 'Debe seleccionar un usuario de cocina válido' }), // ID del usuario asignado (requerido)
  });

// Esquema para actualizar una pantalla de preparación existente - basado en el de creación
export const UpdatePreparationScreenSchema = CreatePreparationScreenSchema.omit(
  { userId: true },
).extend({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder los 100 caracteres')
    .optional(),
  description: z
    .string()
    .max(255, 'La descripción no puede exceder los 255 caracteres')
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
  userId: z
    .string()
    .min(1, 'Debe seleccionar un usuario de cocina')
    .uuid({ message: 'Debe seleccionar un usuario de cocina válido' })
    .optional(), // Opcional en actualización
});

// Tipos inferidos de los esquemas Zod
export type PreparationScreen = z.infer<typeof PreparationScreenSchema>;
export type CreatePreparationScreenDto = z.infer<
  typeof CreatePreparationScreenSchema
>;
export type UpdatePreparationScreenDto = z.infer<
  typeof UpdatePreparationScreenSchema
>;

// Re-exportar tipo de dominio para conveniencia
export type { DomainPreparationScreen };

// Esquema para los filtros de búsqueda/listado
export const FindAllPreparationScreensSchema = z.object({
  name: z.string().optional(),
  isActive: z.boolean().optional(),
  // Añadir otros filtros si son necesarios, ej: productId
});

// Tipo inferido para los filtros de búsqueda/listado
export type FindAllPreparationScreensDto = z.infer<
  typeof FindAllPreparationScreensSchema
>;
