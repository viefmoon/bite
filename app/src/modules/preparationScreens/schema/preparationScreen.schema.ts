import { z } from "zod";

// Esquema principal para la entidad PreparationScreen
export const PreparationScreenSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
  // productIds: z.array(z.string().uuid()).optional(), // Descomentar si la API devuelve los IDs de productos asociados
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// Esquema para crear una nueva pantalla de preparación
export const CreatePreparationScreenSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder los 100 caracteres"),
  description: z
    .string()
    .max(255, "La descripción no puede exceder los 255 caracteres")
    .nullable()
    .optional(),
  isActive: z.boolean().optional().default(true),
  productIds: z.array(z.string().uuid()).optional(), // IDs de productos asociados (opcional)
});

// Esquema para actualizar una pantalla de preparación existente
export const UpdatePreparationScreenSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder los 100 caracteres")
    .optional(),
  description: z
    .string()
    .max(255, "La descripción no puede exceder los 255 caracteres")
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
  productIds: z.array(z.string().uuid()).optional(), // IDs de productos asociados (opcional)
});

// Tipos inferidos de los esquemas Zod
export type PreparationScreen = z.infer<typeof PreparationScreenSchema>;
export type CreatePreparationScreenDto = z.infer<
  typeof CreatePreparationScreenSchema
>;
export type UpdatePreparationScreenDto = z.infer<
  typeof UpdatePreparationScreenSchema
>;

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
