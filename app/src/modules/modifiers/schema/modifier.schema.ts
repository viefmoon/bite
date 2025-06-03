import { z } from "zod";
// Importar el schema y tipo de dominio centralizados
import { modifierSchema as domainModifierSchema } from "../../../app/schemas/domain/modifier.schema"; // Importar el schema Zod
import type { Modifier } from "../../../app/schemas/domain/modifier.schema"; // Mantener importación de tipo

// Schema para DTO de creación (definido manualmente, sin id)
export const createModifierSchema = z.object({
  groupId: z.string().uuid("El ID del grupo no es válido"),
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(255).nullable().optional(),
  price: z.coerce.number().nullable().optional(),
  sortOrder: z.number().int().default(0),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type CreateModifierInput = z.infer<typeof createModifierSchema>;

// Schema para DTO de actualización (parcial, sin id ni groupId)
export const updateModifierSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(255).nullable().optional(),
  price: z.coerce.number().nullable().optional(),
  sortOrder: z.number().int().default(0),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
}).partial(); // Hacer todos los campos opcionales
export type UpdateModifierInput = z.infer<typeof updateModifierSchema>;


// Schema específico para validación del formulario (puede tener reglas diferentes a los DTOs)
export const modifierFormValidationSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(255).nullable().optional(),
  // Usar z.preprocess para manejar strings vacíos o null antes de coercer a número
  price: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce.number().nullable().optional()
  ),
  sortOrder: z.preprocess(
    (val) => (val === "" || val === null ? 0 : val), // Default a 0 si está vacío
    z.coerce.number().int().optional().default(0)
  ),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});
// Nota: No se infiere un tipo específico para el formulario aquí,
// se puede inferir donde se use si es necesario: z.infer<typeof modifierFormValidationSchema>


// Schema para la respuesta de la API (extiende el schema de dominio)
export const modifierApiSchema = domainModifierSchema.extend({
  // Añadir campos que vienen de la API pero no están en el schema de dominio base
  // (Asumiendo que la API devuelve estos campos para un modificador)
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
  // Si la API devuelve el grupo asociado, se podría añadir aquí:
  // modifierGroup: domainModifierGroupSchema.optional(), // O el schema API si es diferente
});

// Re-exportar el tipo de dominio centralizado
export type { Modifier };
