import { z } from 'zod';

/**
 * Esquema Zod para validar la estructura de una foto en el dominio.
 * Fuente de verdad centralizada.
 */
export const photoSchema = z.object({
  id: z.string().uuid(), // ID puede ser custom format
  path: z.string(), // Acepta rutas relativas, la URL completa se construye con getImageUrl
});

// Tipo TypeScript inferido y exportado centralmente
export type Photo = z.infer<typeof photoSchema>;
