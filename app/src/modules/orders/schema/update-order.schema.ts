import { z } from 'zod';
import {
  orderTypeSchema,
  orderStatusSchema,
} from '@/app/schemas/domain/order.schema';
import { deliveryInfoSchema } from '@/app/schemas/domain/delivery-info.schema';

// Schema para modificadores de producto
export const productModifierDtoSchema = z.object({
  modifierId: z.string().uuid(),
});

export type ProductModifierDto = z.infer<typeof productModifierDtoSchema>;

// Schema para personalizaciones de pizza seleccionadas
export const selectedPizzaCustomizationDtoSchema = z.object({
  pizzaCustomizationId: z.string().uuid(),
  half: z.enum(['FULL', 'HALF_1', 'HALF_2']),
  action: z.enum(['ADD', 'REMOVE']),
});

export type SelectedPizzaCustomizationDto = z.infer<
  typeof selectedPizzaCustomizationDtoSchema
>;

// Schema para items en el DTO de actualización
export const orderItemDtoForBackendSchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid(),
  productVariantId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().positive(), // NOTA: Siempre será 1, el backend ya no maneja cantidades
  basePrice: z.number().nonnegative(),
  finalPrice: z.number().nonnegative(),
  preparationNotes: z.string().nullable().optional(),
  productModifiers: z.array(productModifierDtoSchema).optional(),
  selectedPizzaCustomizations: z
    .array(selectedPizzaCustomizationDtoSchema)
    .optional(),
});

export type OrderItemDtoForBackend = z.infer<
  typeof orderItemDtoForBackendSchema
>;

// Schema para ajustes en el DTO
export const orderAdjustmentDtoSchema = z.object({
  orderId: z.string().uuid().optional(),
  name: z.string().min(1),
  isPercentage: z.boolean(),
  value: z.number().optional(),
  amount: z.number().optional(),
});

export type OrderAdjustmentDto = z.infer<typeof orderAdjustmentDtoSchema>;

// Schema para el payload de actualización de orden
export const updateOrderPayloadSchema = z.object({
  orderType: orderTypeSchema.optional(),
  items: z.array(orderItemDtoForBackendSchema).optional(),
  tableId: z.string().uuid().nullable().optional(),
  scheduledAt: z.date().nullable().optional(),
  deliveryInfo: deliveryInfoSchema.optional(),
  notes: z.string().nullable().optional(),
  status: orderStatusSchema.optional(),
  total: z.number().nonnegative().optional(),
  subtotal: z.number().nonnegative().optional(),
  adjustments: z.array(orderAdjustmentDtoSchema).optional(),
});

export type UpdateOrderPayload = z.infer<typeof updateOrderPayloadSchema>;
