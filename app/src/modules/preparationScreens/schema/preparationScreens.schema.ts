import { z } from "zod";

// Asumiendo que existe un schema base para Product en el módulo de productos
// Si no existe, se puede definir uno básico aquí o importar el tipo directamente.
// Por ahora, usaremos un schema placeholder.
const productSchemaPlaceholder = z.object({
  id: z.string().uuid(),
  name: z.string(),
  // otros campos relevantes del producto...
});

// Schema base para PreparationScreen (refleja el dominio/entidad)
export const preparationScreenSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(255).nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().optional(), // O z.date() si se transforma
  updatedAt: z.string().datetime().optional(), // O z.date() si se transforma
  products: z.array(productSchemaPlaceholder).optional(), // Relación opcional en el frontend inicialmente
});

// Tipo inferido de la entidad
export type PreparationScreen = z.infer<typeof preparationScreenSchema>;

// Schema para el DTO de creación (coincide con el backend)
export const createPreparationScreenDtoSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(255).nullable().optional(),
  isActive: z.boolean().optional().default(true),
  productIds: z.array(z.string().uuid()).optional().default([]), // Array de UUIDs
});

// Tipo inferido del DTO de creación
export type CreatePreparationScreenDto = z.infer<
  typeof createPreparationScreenDtoSchema
>;

// Schema para el DTO de actualización (coincide con el backend)
export const updatePreparationScreenDtoSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100).optional(),
  description: z.string().max(255).nullable().optional(),
  isActive: z.boolean().optional(),
  productIds: z.array(z.string().uuid()).optional(), // Permitir enviar array vacío o no enviar nada
});

// Tipo inferido del DTO de actualización
export type UpdatePreparationScreenDto = z.infer<
  typeof updatePreparationScreenDtoSchema
>;

// Schema para los filtros de búsqueda (coincide con el backend)
// Los parámetros de paginación (page, limit) se manejan directamente en la llamada a React Query
export const findAllPreparationScreensFilterSchema = z.object({
  name: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Tipo inferido de los filtros
export type FindAllPreparationScreensFilter = z.infer<
  typeof findAllPreparationScreensFilterSchema
>;

// Schema para el formulario (puede ser igual a Create/Update o tener variaciones)
// Usaremos Create como base. El manejo de productIds será específico del componente de formulario.
export const preparationScreenFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(255).nullable().optional(),
  isActive: z.boolean().optional().default(true),
  // productIds no se incluye aquí, se manejará por separado en el estado del form modal
});

// Tipo inferido para el formulario (sin productIds aquí)
export type PreparationScreenFormData = z.infer<
  typeof preparationScreenFormSchema
>;
