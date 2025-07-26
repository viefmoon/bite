import { z } from 'zod';
import type { Table } from '../../../app/schemas/domain/table.schema';
const tableBaseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  capacity: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.coerce
      .number()
      .int()
      .positive('La capacidad debe ser un número positivo')
      .nullable()
      .optional(),
  ),
  isActive: z.boolean().optional(),
});

export const CreateTableSchema = tableBaseSchema.extend({
  isActive: z.boolean().optional().default(true),
});

export const UpdateTableSchema = tableBaseSchema.partial();

export type CreateTableDto = z.infer<typeof CreateTableSchema>;
export type UpdateTableDto = z.infer<typeof UpdateTableSchema>;

const transformBoolean = (val: unknown) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return val;
};

export const FindAllTablesSchema = z.object({
  name: z.string().optional(),
  areaId: z.string().uuid().optional(),
  capacity: z.coerce.number().int().optional(),
  isActive: z.preprocess(transformBoolean, z.boolean().optional()),
  isAvailable: z.preprocess(transformBoolean, z.boolean().optional()),
  isTemporary: z.preprocess(transformBoolean, z.boolean().optional()),
});
export type FindAllTablesDto = z.infer<typeof FindAllTablesSchema>;

export type { Table };
