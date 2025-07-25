import { z } from 'zod';
import type { Photo } from '@/app/schemas/domain/photo.schema';
import type { Modifier } from '@/app/schemas/domain/modifier.schema';
import type { ModifierGroup } from '@/app/schemas/domain/modifier-group.schema';
import type { ProductVariant } from '@/app/schemas/domain/product-variant.schema';
import type { Product } from '@/app/schemas/domain/product.schema';
import type { SubCategory } from '@/app/schemas/domain/subcategory.schema';
import type { Category } from '@/app/schemas/domain/category.schema';
import {
  orderStatusSchema,
  orderTypeSchema,
} from '@/app/schemas/domain/order.schema';
import type {
  OrderItemModifier,
  OrderItem,
  OrderStatus,
  OrderType,
  Order,
} from '@/app/schemas/domain/order.schema';

// Re-exportar tipos de dominio
export type {
  Photo,
  Modifier,
  ModifierGroup,
  ProductVariant,
  Product,
  SubCategory,
  Category,
  OrderItemModifier,
  OrderItem,
  OrderStatus,
  OrderType,
  Order,
};

// Exportar los valores de los enums para uso en runtime
export const OrderStatusEnum = orderStatusSchema.enum;
export const OrderTypeEnum = orderTypeSchema.enum;

// --- Schemas específicos del módulo de Órdenes ---

// Tipos extendidos para el menú completo con relaciones anidadas
export interface FullMenuModifierGroup extends ModifierGroup {
  productModifiers?: Modifier[];
}

export interface FullMenuProduct extends Product {
  variants?: ProductVariant[];
  modifierGroups?: FullMenuModifierGroup[];
}

export interface FullMenuSubCategory extends SubCategory {
  products?: FullMenuProduct[];
}

export interface FullMenuCategory extends Category {
  subcategories?: FullMenuSubCategory[];
}

// Schema para filtrar órdenes
export const findAllOrdersDtoSchema = z.object({
  userId: z.string().uuid().optional(),
  tableId: z.string().uuid().optional(),
  orderStatus: z
    .union([orderStatusSchema, z.array(orderStatusSchema)])
    .optional(),
  orderType: orderTypeSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
});

export type FindAllOrdersDto = z.infer<typeof findAllOrdersDtoSchema>;

// Schema para orden en lista abierta
export const orderOpenListSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  status: orderStatusSchema,
  type: orderTypeSchema,
  totalAmount: z.number(),
  tableNumber: z.number().nullable(),
  customerName: z.string().nullable(),
  itemCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  table: z
    .object({
      id: z.string().uuid(),
      number: z.number(),
      name: z.string(),
      isTemporary: z.boolean(),
      area: z
        .object({
          name: z.string(),
        })
        .optional(),
    })
    .nullable()
    .optional(),
  deliveryInfo: z
    .object({
      recipientName: z.string(),
      recipientPhone: z.string().nullable(),
      address: z
        .object({
          id: z.string().uuid(),
          name: z.string(),
          street: z.string(),
          number: z.string(),
          interiorNumber: z.string().nullable(),
          neighborhood: z.string(),
          latitude: z.number().nullable(),
          longitude: z.number().nullable(),
        })
        .nullable(),
    })
    .nullable()
    .optional(),
  customer: z
    .object({
      id: z.string().uuid(),
      firstName: z.string(),
      lastName: z.string(),
      whatsappPhoneNumber: z.string(),
    })
    .nullable()
    .optional(),
});

export type OrderOpenList = z.infer<typeof orderOpenListSchema>;

// Schema para crear orden
export const createOrderSchema = z.object({
  type: orderTypeSchema,
  orderItems: z.array(z.any()), // Definir más específicamente si es necesario
  payments: z.array(z.any()).optional(),
  adjustments: z.array(z.any()).optional(),
  tableId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  deliveryInfo: z.any().optional(), // Definir más específicamente si es necesario
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;

// Schema para orden con inclusiones
export const orderWithIncludesSchema = z.object({
  includeItems: z.boolean().optional(),
  includePayments: z.boolean().optional(),
  includeAdjustments: z.boolean().optional(),
  includeUser: z.boolean().optional(),
  includeCustomer: z.boolean().optional(),
  includeTable: z.boolean().optional(),
});

export type OrderWithIncludes = z.infer<typeof orderWithIncludesSchema>;

// Schema para parámetros de audio
export const audioOrderParamsSchema = z.object({
  audioFileUri: z.string(),
  duration: z.number(),
  tableNumber: z.number().optional(),
  areaId: z.string().uuid().optional(),
  customerPhone: z.string().optional(),
  orderType: orderTypeSchema.optional(),
});

export type AudioOrderParams = z.infer<typeof audioOrderParamsSchema>;

// Schema para respuesta de audio
export const audioOrderResponseSchema = z.object({
  success: z.boolean(),
  parsedOrder: z
    .object({
      items: z.array(
        z.object({
          productName: z.string(),
          variantName: z.string().nullable(),
          quantity: z.number(),
          modifiers: z.array(z.string()),
          specialInstructions: z.string().nullable(),
        }),
      ),
      tableNumber: z.number().nullable(),
      customerPhone: z.string().nullable(),
      orderType: orderTypeSchema,
      specialRequests: z.string().nullable(),
      deliveryAddress: z.string().nullable(),
    })
    .optional(),
  error: z.string().optional(),
  transcription: z.string().optional(),
});

export type AudioOrderResponse = z.infer<typeof audioOrderResponseSchema>;
