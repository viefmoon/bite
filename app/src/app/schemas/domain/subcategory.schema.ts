import { z } from 'zod';
import { photoSchema } from './photo.schema'; // Importar schema de Photo centralizado
// import { productSchema } from './product.schema'; // Opcional: Importar si se incluyen productos

/**
 * Esquema Zod para validar un objeto SubCategory completo.
 * Fuente de verdad centralizada.
 */
export const subCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
  categoryId: z.string().uuid('El ID de categoría no es válido'),
  sortOrder: z.number(),
  photo: photoSchema.nullable().optional(), // Usar photoSchema centralizado
  // Opcional: Incluir productos si es relevante en el dominio general
  // products: z.array(productSchema).optional(),
  createdAt: z.union([z.string().datetime(), z.date()]).optional(), // Incluido desde la interfaz original
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(), // Incluido desde la interfaz original
});

// Tipo TypeScript inferido y exportado centralmente
export type SubCategory = z.infer<typeof subCategorySchema>;
