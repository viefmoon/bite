import { z } from 'zod';
// Importar Modifier si se incluye en el schema de dominio
// import { modifierSchema } from './modifier.schema';

/**
 * Esquema Zod para validar un objeto ModifierGroup completo.
 * Fuente de verdad centralizada.
 */
export const modifierGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().nullable().optional(),
  minSelections: z.number().int().min(0).optional(),
  maxSelections: z.number().int().min(1).optional(),
  isRequired: z.boolean().optional(),
  allowMultipleSelections: z.boolean().optional(),
  isActive: z.boolean().optional(), // Mantener opcional si la API puede no devolverlo siempre
  sortOrder: z.number(),
  // Opcional: Incluir schema de modificadores si es parte del dominio central
  // modifiers: z.array(modifierSchema).optional(),
});

// Tipo TypeScript inferido y exportado centralmente
export type ModifierGroup = z.infer<typeof modifierGroupSchema>;
