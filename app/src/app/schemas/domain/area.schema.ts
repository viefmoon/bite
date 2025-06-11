import { z } from 'zod';

// Única fuente de verdad para la entidad Area
export const areaSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime().optional(), // O z.date() si se prefiere
  updatedAt: z.string().datetime().optional(), // O z.date() si se prefiere
});

// Tipo TypeScript inferido y exportado centralmente
export type Area = z.infer<typeof areaSchema>;
