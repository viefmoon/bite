import { z } from 'zod';
// Importar tipo de dominio centralizado
import { modifierGroupSchema as domainModifierGroupSchema } from '../../../app/schemas/domain/modifier-group.schema'; // Importar el schema Zod
import type { ModifierGroup } from '../../../app/schemas/domain/modifier-group.schema'; // Mantener importación de tipo

// Schema base para modifier group con campos comunes
export const modifierGroupBaseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().nullable().optional(),
  minSelections: z.number().int().min(0).optional(),
  maxSelections: z.number().int().min(1).optional(),
  isRequired: z.boolean().optional(),
  allowMultipleSelections: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional().default(0),
});

// Schema de validación para el formulario - derivado del base con reglas de negocio
export const modifierGroupFormValidationSchema =
  modifierGroupBaseSchema.superRefine((data, ctx) => {
    if (data.allowMultipleSelections) {
      if (data.maxSelections === undefined || data.maxSelections === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['maxSelections'],
          message:
            'Máx. selecciones es requerido si se permiten múltiples selecciones.',
        });
      } else {
        if (data.maxSelections <= 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['maxSelections'],
            message:
              'Máx. selecciones debe ser mayor que 1 si se permiten múltiples selecciones.',
          });
        }

        const min = data.minSelections ?? 0;
        if (data.maxSelections > 1 && min > data.maxSelections) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['minSelections'],
            message:
              'Mín. selecciones no puede ser mayor que Máx. selecciones.',
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['maxSelections'],
            message:
              'Máx. selecciones no puede ser menor que Mín. selecciones.',
          });
        }
      }
    } else {
      // Si no se permiten múltiples selecciones, maxSelections debe ser 1
      // y minSelections debe ser 0 o 1 (dependiendo de isRequired)
      // Esta lógica puede ajustarse según las reglas de negocio exactas.
      // Por ahora, no añadimos validación extra aquí si allowMultipleSelections es false.
    }
  });

// Tipo inferido para el formulario
export type ModifierGroupFormInputs = z.infer<
  typeof modifierGroupFormValidationSchema
>;

// Schema para DTO de creación - derivado del base con transformaciones
export const createModifierGroupSchema = modifierGroupBaseSchema.transform(
  (data) => ({
    ...data,
    minSelections: data.minSelections ?? 0,
    isRequired: data.isRequired ?? false,
    allowMultipleSelections: data.allowMultipleSelections ?? false,
    isActive: data.isActive ?? true,
    sortOrder: data.sortOrder ?? 0,
    maxSelections: data.allowMultipleSelections ? (data.maxSelections ?? 1) : 1,
  }),
);
// Tipo inferido para DTO de creación
export type CreateModifierGroupInput = z.infer<
  typeof createModifierGroupSchema
>;

// Schema para DTO de actualización - derivado del base con todos los campos opcionales
export const updateModifierGroupSchema = modifierGroupBaseSchema.partial();
// Tipo inferido para DTO de actualización
export type UpdateModifierGroupInput = z.infer<
  typeof updateModifierGroupSchema
>;

// Schema para la respuesta de la API (extiende el schema de dominio)
export const modifierGroupApiSchema = domainModifierGroupSchema.extend({
  // Añadir campos que vienen de la API pero no están en el schema de dominio base
  id: z.string(), // ID puede ser custom format como "MODG-7"
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
  // Definir schemas placeholder o importar los reales si existen
  productModifiers: z.array(z.any()).optional(), // Usar z.any() o un schema específico si existe
  products: z.array(z.any()).optional(), // Usar z.any() o un schema específico si existe
});

// Re-exportar el tipo de dominio centralizado
export type { ModifierGroup };

// Alias para compatibilidad con código existente
export const modifierGroupSchema = modifierGroupFormValidationSchema;
// modifierGroupBaseSchema ya está exportado arriba
