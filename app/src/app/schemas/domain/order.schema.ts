import { z } from 'zod';
import { adjustmentSchema } from './adjustment.schema';
import { deliveryInfoSchema } from './delivery-info.schema';
import { tableSchema } from './table.schema';
import { paymentSchema } from '@/modules/orders/schema/payment.schema';
import { userSchema } from './user.schema';

// Definir enums localmente para evitar dependencias circulares
enum PizzaHalf {
  FULL = 'FULL',
  HALF_1 = 'HALF_1',
  HALF_2 = 'HALF_2',
}

enum CustomizationAction {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
}

// Enum para los estados de la orden
export const orderStatusSchema = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'IN_PREPARATION',
  'READY',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

// Enum para los tipos de orden
export const orderTypeSchema = z.enum(['DINE_IN', 'TAKE_AWAY', 'DELIVERY']);
export type OrderType = z.infer<typeof orderTypeSchema>;

// Schema para los modificadores dentro de un ítem de orden
export const orderItemModifierSchema = z.object({
  productModifierId: z.string(),
  modifierName: z.string(),
  price: z.number(),
});
export type OrderItemModifier = z.infer<typeof orderItemModifierSchema>;

// Schema para las personalizaciones de pizza seleccionadas
export const selectedPizzaCustomizationSchema = z.object({
  pizzaCustomizationId: z.string(),
  pizzaCustomization: z
    .object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['FLAVOR', 'INGREDIENT']),
      ingredients: z.string().nullable().optional(),
      toppingValue: z.number(),
      isActive: z.boolean(),
      sortOrder: z.number(),
    })
    .optional(),
  half: z.nativeEnum(PizzaHalf),
  action: z.nativeEnum(CustomizationAction),
});
export type SelectedPizzaCustomization = z.infer<
  typeof selectedPizzaCustomizationSchema
>;

// Schema para un ítem individual de la orden
export const orderItemSchema = z.object({
  id: z.string(),
  productId: z.string().uuid(),
  productName: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
  totalPrice: z.number(),
  modifiers: z.array(orderItemModifierSchema),
  variantId: z.string().uuid().nullable().optional(),
  variantName: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  selectedPizzaCustomizations: z
    .array(selectedPizzaCustomizationSchema)
    .optional(),
});
export type OrderItem = z.infer<typeof orderItemSchema>;

// Schema para la orden completa
export const orderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string().optional(),
  shiftOrderNumber: z.number().int().positive(),
  orderItems: z.array(orderItemSchema).optional(),
  total: z.coerce.number().optional(),
  orderStatus: orderStatusSchema,
  orderType: orderTypeSchema,
  createdAt: z.union([z.string().datetime(), z.date()]),
  updatedAt: z.union([z.string().datetime(), z.date()]),
  finalizedAt: z.union([z.string().datetime(), z.date()]).nullable().optional(),
  userId: z.string().uuid().nullable().optional(),
  tableId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  scheduledAt: z.union([z.string().datetime(), z.date()]).nullable().optional(),
  deliveryInfo: deliveryInfoSchema,
  user: userSchema.optional(),
  table: tableSchema.optional(),
  payments: z.array(paymentSchema).optional(),
  deletedAt: z.string().nullable().optional(),
  adjustments: z.array(adjustmentSchema).optional(),
  subtotal: z.coerce.number().optional(),
  isFromWhatsApp: z.boolean().optional().default(false),
  estimatedDeliveryTime: z
    .union([z.string().datetime(), z.date()])
    .nullable()
    .optional(),
});
export type Order = z.infer<typeof orderSchema>;
