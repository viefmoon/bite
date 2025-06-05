import { z } from "zod";

// Enum para los estados de la orden
export const orderStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "READY",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

// Enum para los tipos de orden
export const orderTypeSchema = z.enum([
  "DINE_IN",
  "TAKE_AWAY",
  "DELIVERY",
]);
export type OrderType = z.infer<typeof orderTypeSchema>;

// Schema para los modificadores dentro de un ítem de orden
export const orderItemModifierSchema = z.object({
  modifierId: z.string().uuid(), // Asumiendo UUID
  modifierName: z.string(),
  price: z.number(),
  // modifierGroupId: z.string().uuid().optional(), // Opcional
});
export type OrderItemModifier = z.infer<typeof orderItemModifierSchema>;

// Schema para un ítem individual de la orden
export const orderItemSchema = z.object({
  id: z.string(), // Puede ser UUID o ID temporal
  productId: z.string().uuid(),
  productName: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
  totalPrice: z.number(),
  modifiers: z.array(orderItemModifierSchema),
  variantId: z.string().uuid().nullable().optional(),
  variantName: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type OrderItem = z.infer<typeof orderItemSchema>;

// Schema para la orden completa
export const orderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string().optional(), // Hacer opcional si no siempre está presente
  dailyNumber: z.number().int().positive(),
  orderItems: z.array(z.any()).optional(), // Changed from 'items' to 'orderItems' to match API
  total: z.union([z.string(), z.number()]).optional(), // The API returns 'total' not 'totalAmount'
  orderStatus: orderStatusSchema, // Changed from 'status' to 'orderStatus' to match API
  orderType: orderTypeSchema,
  createdAt: z.union([z.string().datetime(), z.date()]), // Permitir string o Date
  updatedAt: z.union([z.string().datetime(), z.date()]), // Permitir string o Date
  userId: z.string().uuid().nullable().optional(), // Changed from 'customerId' to 'userId' to match API
  tableId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  scheduledAt: z.union([z.string().datetime(), z.date()]).nullable().optional(),
  customerName: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  deliveryAddress: z.string().nullable().optional(),
  // Add fields that API returns but were missing
  user: z.any().optional(),
  table: z.any().optional(),
  dailyOrderCounter: z.any().optional(),
  payments: z.array(z.any()).optional(),
  deletedAt: z.string().nullable().optional(),
  dailyOrderCounterId: z.string().uuid().nullable().optional(),
});
export type Order = z.infer<typeof orderSchema>;