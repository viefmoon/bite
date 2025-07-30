import { z } from 'zod';
import { tableSchema } from '@/app/schemas/domain/table.schema';

// Esquema para el formulario de CREACIÓN
export const CreateTableSchema = tableSchema
  .pick({
    name: true,
    areaId: true,
    capacity: true,
    isActive: true,
    isAvailable: true,
    isTemporary: true,
    temporaryIdentifier: true,
  })
  .extend({
    // Validaciones específicas del formulario
    name: z.string().min(1, 'El nombre es requerido'),
    areaId: z.string().uuid('Debe seleccionar un área válida'),
    capacity: z.preprocess(
      (val) => (val === '' || val === null ? undefined : val),
      z.coerce
        .number()
        .int()
        .positive('La capacidad debe ser un número positivo')
        .nullable()
        .optional(),
    ),
    isActive: z.boolean().optional().default(true),
    isAvailable: z.boolean().optional().default(true),
    isTemporary: z.boolean().optional().default(false),
    temporaryIdentifier: z.string().nullable().optional(),
  });

export type CreateTableDto = z.infer<typeof CreateTableSchema>;

// Esquema para el formulario de ACTUALIZACIÓN
export const UpdateTableSchema = CreateTableSchema.partial();
export type UpdateTableDto = z.infer<typeof UpdateTableSchema>;

// Tipo para filtros de búsqueda
export type FindAllTablesDto = {
  name?: string;
  areaId?: string;
  capacity?: number;
  isActive?: boolean;
  isAvailable?: boolean;
  isTemporary?: boolean;
};
