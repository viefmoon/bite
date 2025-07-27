import { z } from 'zod';

// Única fuente de verdad para la entidad Area
export const areaSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(), // Backend: default: ''
  isActive: z.boolean(),
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(),
  deletedAt: z.union([z.string().datetime(), z.date()]).nullable().optional(),
  // Relaciones opcionales (usando type para evitar dependencias circulares)
  tables: z.array(z.any()).optional(), // Table[] - se define por separado para evitar ciclos
});

// Tipo TypeScript inferido y exportado centralmente
export type Area = z.infer<typeof areaSchema>;
