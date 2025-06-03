import { z } from "zod";
// Importar el tipo de dominio centralizado
import type { Table } from "../../../app/schemas/domain/table.schema";

// Schemas específicos para DTOs (Create, Update, FindAll) permanecen aquí
export const CreateTableSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  capacity: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce
      .number()
      .int()
      .positive("La capacidad debe ser un número positivo")
      .nullable()
      .optional()
  ),
  isActive: z.boolean().optional().default(true),
  // areaId se añadirá en el servicio al crear, no viene del formulario directamente
});

export const UpdateTableSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  capacity: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce
      .number()
      .int()
      .positive("La capacidad debe ser un número positivo")
      .nullable()
      .optional()
  ),
  isActive: z.boolean().optional(),
  // areaId no se suele actualizar, pero si fuera necesario, se añadiría aquí
});

export type CreateTableDto = z.infer<typeof CreateTableSchema>;
export type UpdateTableDto = z.infer<typeof UpdateTableSchema>;

const transformBoolean = (val: unknown) => {
  if (val === "true") return true;
  if (val === "false") return false;
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

// Re-exportar el tipo de dominio para conveniencia del módulo
export type { Table };
