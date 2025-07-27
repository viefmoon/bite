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
  // Relaciones opcionales (usando z.lazy para evitar dependencias circulares)
  tables: z
    .array(
      z.lazy(() =>
        z.object({
          id: z.string().uuid(),
          name: z.string(),
          areaId: z.string().uuid(),
          capacity: z.number().int().nullable().optional(),
          isActive: z.boolean(),
          isAvailable: z.boolean(),
          isTemporary: z.boolean(),
          temporaryIdentifier: z.string().nullable().optional(),
          createdAt: z.union([z.string().datetime(), z.date()]).optional(),
          updatedAt: z.union([z.string().datetime(), z.date()]).optional(),
          deletedAt: z
            .union([z.string().datetime(), z.date()])
            .nullable()
            .optional(),
        }),
      ),
    )
    .optional(),
});

// Tipo TypeScript inferido y exportado centralmente
export type Area = z.infer<typeof areaSchema>;
