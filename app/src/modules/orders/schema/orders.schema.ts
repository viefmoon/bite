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

// --- Interfaces específicas del módulo de Órdenes ---

// Tipos para el menú completo con relaciones anidadas
// Extendemos los tipos base para incluir las relaciones necesarias
export type FullMenuModifierGroup = ModifierGroup & {
  productModifiers?: Modifier[];
};

export type FullMenuProduct = Product & {
  modifierGroups?: FullMenuModifierGroup[];
  variants?: ProductVariant[];
  pizzaCustomizations?: any[];
  pizzaConfiguration?: any;
};

export type FullMenuSubCategory = SubCategory & {
  products: FullMenuProduct[];
};

export type FullMenuCategory = Category & {
  subcategories: FullMenuSubCategory[];
};

// Schema para orden en lista abierta
export const orderOpenListSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  shiftOrderNumber: z.number().optional(),
  orderStatus: orderStatusSchema,
  orderType: orderTypeSchema,
  totalAmount: z.number(),
  total: z.coerce.number().optional(),
  tableNumber: z.number().nullable(),
  customerName: z.string().nullable(),
  itemCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isFromWhatsApp: z.boolean().optional(),
  notes: z.string().optional(),
  ticketImpressionCount: z.number().optional(),
  paymentsSummary: z
    .object({
      totalPaid: z.number(),
    })
    .optional(),
  preparationScreenStatuses: z
    .array(
      z.object({
        name: z.string(),
        status: z.enum(['READY', 'IN_PROGRESS', 'PENDING']),
      }),
    )
    .optional(),
  createdBy: z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      username: z.string().optional(),
    })
    .optional(),
  table: z
    .object({
      id: z.string().uuid(),
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
      fullAddress: z.string().optional(),
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


