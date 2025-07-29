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

  // Relaciones opcionales (usando z.lazy para evitar dependencias circulares)
  order: z
    .lazy(() =>
      z.object({
        id: z.string().uuid(),
        orderNumber: z.string().optional(),
        shiftOrderNumber: z.number().int().positive(),
        total: z.coerce.number().optional(),
        orderStatus: z.enum([
          'PENDING',
          'IN_PROGRESS',
          'IN_PREPARATION',
          'READY',
          'DELIVERED',
          'COMPLETED',
          'CANCELLED',
        ]),
        orderType: z.enum(['DINE_IN', 'TAKE_AWAY', 'DELIVERY']),
      }),
    )
    .optional(),
  orderItem: z
    .lazy(() =>
      z.object({
        id: z.string(),
        productId: z.string().uuid(),
        productName: z.string(),
        quantity: z.number().int().positive(),
        unitPrice: z.number(),
        totalPrice: z.number(),
        variantId: z.string().uuid().nullable().optional(),
        variantName: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      }),
    )
    .optional(),
  appliedBy: z
    .lazy(() =>
      z.object({
        id: z.string().uuid(),
        username: z.string(),
        firstName: z.string().nullable().optional(),
        lastName: z.string().nullable().optional(),
        email: z.string().email().nullable().optional(),
        isActive: z.boolean(),
      }),
    )
    .optional(),
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
