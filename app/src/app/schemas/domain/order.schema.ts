import { z } from 'zod';
import { adjustmentSchema } from './adjustment.schema';
import { PizzaHalf, CustomizationAction } from '@/modules/pizzaCustomizations/types/pizzaCustomization.types';

// Enum para los estados de la orden
export const orderStatusSchema = z.enum([
  'PENDING',
  'IN_PROGRESS',
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
  half: z.nativeEnum(PizzaHalf),
  action: z.nativeEnum(CustomizationAction),
});
export type SelectedPizzaCustomization = z.infer<typeof selectedPizzaCustomizationSchema>;

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
  selectedPizzaCustomizations: z.array(selectedPizzaCustomizationSchema).optional(),
});
export type OrderItem = z.infer<typeof orderItemSchema>;

// Schema para la orden completa
export const orderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string().optional(),
  dailyNumber: z.number().int().positive(),
  orderItems: z.array(z.any()).optional(),
  total: z.union([z.string(), z.number()]).optional(),
  orderStatus: orderStatusSchema,
  orderType: orderTypeSchema,
  createdAt: z.union([z.string().datetime(), z.date()]),
  updatedAt: z.union([z.string().datetime(), z.date()]),
  userId: z.string().uuid().nullable().optional(),
  tableId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  scheduledAt: z.union([z.string().datetime(), z.date()]).nullable().optional(),
  customerName: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  deliveryAddress: z.string().nullable().optional(),
  user: z.any().optional(),
  table: z.any().optional(),
  dailyOrderCounter: z.any().optional(),
  payments: z.array(z.any()).optional(),
  deletedAt: z.string().nullable().optional(),
  dailyOrderCounterId: z.string().uuid().nullable().optional(),
  adjustments: z.array(adjustmentSchema).optional(),
  subtotal: z.union([z.string(), z.number()]).optional(),
  isFromWhatsApp: z.boolean().optional().default(false),
});
export type Order = z.infer<typeof orderSchema>;
