import { z } from 'zod';
import { orderStatusSchema } from '@/app/schemas/domain/order.schema';

// Enums
export const orderTypeSchema = z.enum(['DINE_IN', 'TAKE_AWAY', 'DELIVERY']);
export const preparationStatusSchema = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'READY',
  'DELIVERED',
  'CANCELLED',
]);
export const preparationScreenStatusSchema = z.enum([
  'PENDING',
  'IN_PREPARATION',
  'READY',
]);

export type OrderType = z.infer<typeof orderTypeSchema>;
export type PreparationStatus = z.infer<typeof preparationStatusSchema>;
export type PreparationScreenStatus = z.infer<
  typeof preparationScreenStatusSchema
>;

// Exportar los valores de los enums para uso en runtime
export const OrderTypeEnum = orderTypeSchema.enum;
export const PreparationStatusEnum = preparationStatusSchema.enum;
export const PreparationScreenStatusEnum = preparationScreenStatusSchema.enum;

// Exportar como constantes para uso en runtime en comparaciones
export const PreparationStatus = PreparationStatusEnum;
export const PreparationScreenStatus = PreparationScreenStatusEnum;

// Esquema para KitchenOrderItem
export const kitchenOrderItemSchema = z.object({
  id: z.string(),
  productName: z.string(),
  variantName: z.string().optional(),
  modifiers: z.array(z.string()),
  pizzaCustomizations: z
    .array(
      z.object({
        customizationName: z.string(),
        action: z.string(),
        half: z.string().optional(),
      }),
    )
    .optional(),
  preparationNotes: z.string().optional(),
  preparationStatus: preparationStatusSchema,
  preparedAt: z.string().optional(),
  preparedByUser: z
    .object({
      firstName: z.string(),
      lastName: z.string(),
    })
    .optional(),
  quantity: z.number(),
  belongsToMyScreen: z.boolean(),
});

export type KitchenOrderItem = z.infer<typeof kitchenOrderItemSchema>;

// Esquema para PreparationScreenStatusInfo
export const preparationScreenStatusInfoSchema = z.object({
  screenId: z.string(),
  screenName: z.string(),
  status: preparationScreenStatusSchema,
});

export type PreparationScreenStatusInfo = z.infer<
  typeof preparationScreenStatusInfoSchema
>;

// Esquema para KitchenOrder
export const kitchenOrderSchema = z.object({
  id: z.string(),
  shiftOrderNumber: z.number(),
  orderType: orderTypeSchema,
  orderStatus: orderStatusSchema, // Estado real de la orden
  createdAt: z.string(),
  orderNotes: z.string().optional(),
  // Campos específicos según tipo
  deliveryAddress: z.string().optional(),
  deliveryPhone: z.string().optional(),
  receiptName: z.string().optional(),
  customerPhone: z.string().optional(),
  areaName: z.string().optional(),
  tableName: z.string().optional(),
  items: z.array(kitchenOrderItemSchema),
  hasPendingItems: z.boolean(),
  screenStatuses: z.array(preparationScreenStatusInfoSchema),
  myScreenStatus: preparationScreenStatusSchema.optional(),
  isFromWhatsApp: z.boolean().optional(),
});

export type KitchenOrder = z.infer<typeof kitchenOrderSchema>;

// Esquema para KitchenFilters
export const kitchenFiltersSchema = z.object({
  orderType: orderTypeSchema.optional(),
  showPrepared: z.boolean(),
  showAllProducts: z.boolean(),
  ungroupProducts: z.boolean(),
  screenId: z.string().optional(),
});

export type KitchenFilters = z.infer<typeof kitchenFiltersSchema>;

// Esquema para PreparationScreen
export const preparationScreenSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isActive: z.boolean(),
});

export type PreparationScreen = z.infer<typeof preparationScreenSchema>;
