import { z } from 'zod';

export const orderAdjustmentSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  isPercentage: z.boolean(),
  value: z.number().min(0).max(100).optional(), // Porcentaje (0-100) si isPercentage es true
  amount: z.number().optional(), // Monto fijo si isPercentage es false (puede ser negativo para descuentos)
  // Para UI local
  isNew: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
});

export type OrderAdjustment = z.infer<typeof orderAdjustmentSchema>;

export const adjustmentFormDataSchema = orderAdjustmentSchema.pick({
  name: true,
  isPercentage: true,
  value: true,
  amount: true,
});

export type AdjustmentFormData = z.infer<typeof adjustmentFormDataSchema>;
