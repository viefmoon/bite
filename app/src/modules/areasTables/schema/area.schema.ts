import { z } from "zod";
// Importar el tipo central
import type { Area } from "../../../app/schemas/domain/area.schema";

// Schemas específicos para DTOs (Create, Update, FindAll) permanecen aquí
export const CreateAreaSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const UpdateAreaSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateAreaDto = z.infer<typeof CreateAreaSchema>;
export type UpdateAreaDto = z.infer<typeof UpdateAreaSchema>;

export const FindAllAreasSchema = z.object({
  name: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type FindAllAreasDto = z.infer<typeof FindAllAreasSchema>;

// Re-exportar el tipo de dominio si es conveniente para el módulo
export type { Area };
