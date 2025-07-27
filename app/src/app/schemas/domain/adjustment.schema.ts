import { z } from 'zod';

export const adjustmentSchema = z.object({
  id: z.string(),
  orderId: z.string().nullable().optional(),
  orderItemId: z.string().nullable().optional(),
  name: z.string(),
  isPercentage: z.boolean(),
  value: z.number(), // Porcentaje si isPercentage es true (0-100)
  amount: z.number(), // Monto calculado o fijo
  appliedById: z.string(),
  appliedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),

  // Relaciones opcionales
  order: z.any().optional(),
  orderItem: z.any().optional(),
  appliedBy: z.any().optional(),
});

export type Adjustment = z.infer<typeof adjustmentSchema>;

// Schema base para crear un ajuste (sin validaciones)
const createAdjustmentBaseSchema = z.object({
  orderId: z.string().uuid().optional(),
  orderItemId: z.string().uuid().optional(),
  name: z.string().max(100),
  isPercentage: z.boolean(),
  value: z.number().min(0).max(100).optional(), // Solo requerido si isPercentage es true
  amount: z.number().optional(), // Solo requerido si isPercentage es false
});

// Schema para crear un ajuste con validaciones
export const createAdjustmentSchema = createAdjustmentBaseSchema
  .refine(
    (data) => {
      // Debe tener orderId O orderItemId, pero no ambos
      return (
        (data.orderId && !data.orderItemId) ||
        (!data.orderId && data.orderItemId)
      );
    },
    {
      message:
        'El ajuste debe aplicarse a una orden o a un item de orden, pero no a ambos',
    },
  )
  .refine(
    (data) => {
      // Si es porcentaje, debe tener value. Si no, debe tener amount
      if (data.isPercentage) {
        return data.value !== undefined;
      } else {
        return data.amount !== undefined;
      }
    },
    {
      message:
        "Si es porcentaje debe incluir 'value', si no debe incluir 'amount'",
    },
  );

export type CreateAdjustment = z.infer<typeof createAdjustmentSchema>;
