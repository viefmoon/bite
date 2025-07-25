// Importar tipos de dominio centralizados desde /app/schemas/domain/
import type { Photo } from '@/app/schemas/domain/photo.schema';
import type { Modifier } from '@/app/schemas/domain/modifier.schema';
import type { ModifierGroup } from '@/app/schemas/domain/modifier-group.schema';
import type { ProductVariant } from '@/app/schemas/domain/product-variant.schema'; // Asumiendo que se creará
import type { Product } from '@/app/schemas/domain/product.schema'; // Asumiendo que se creará
import type { SubCategory } from '@/app/schemas/domain/subcategory.schema'; // Asumiendo que se creará
import type { Category } from '@/app/schemas/domain/category.schema';
import {
  orderStatusSchema, // Importar el schema Zod
  orderTypeSchema, // Importar el schema Zod
} from '@/app/schemas/domain/order.schema';
import type {
  OrderItemModifier,
  OrderItem,
  OrderStatus,
  OrderType,
  Order,
} from '@/app/schemas/domain/order.schema'; // Mantener importación de tipos

// Re-exportar tipos de dominio para que otros archivos dentro de este módulo puedan importarlos desde aquí
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

// --- Tipos específicos del módulo de Órdenes que no son entidades de dominio ---

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

// DTO para filtrar órdenes (basado en el backend DTO)
// Este tipo es específico para la API de este módulo, por lo que permanece aquí.
export interface FindAllOrdersDto {
  userId?: string;
  tableId?: string;
  orderStatus?: OrderStatus | OrderStatus[]; // Permitir un array de estados
  orderType?: OrderType;
  startDate?: string; // Usar string para fechas en DTOs
  endDate?: string; // Usar string para fechas en DTOs
  page?: number; // Añadir paginación
  limit?: number; // Añadir paginación
  // Añadir otros campos de filtro si existen en el backend DTO
}

// Otros tipos específicos de este módulo podrían ir aquí, por ejemplo:
// - Tipos para el estado del carrito si no se maneja con Zustand/Context
// - Tipos para formularios específicos de este módulo

// Tipo optimizado para lista de órdenes abiertas
export interface OrderOpenList
  extends Omit<
    Order,
    'orderItems' | 'payments' | 'adjustments' | 'user' | 'customer'
  > {
  // Información básica de la mesa
  table?: {
    id: string;
    number: number;
    name: string;
    isTemporary: boolean;
    area?: {
      name: string;
    };
  } | null;

  // Información básica de entrega
  deliveryInfo?: {
    recipientName: string;
    recipientPhone: string | null;
    fullAddress: string;
  } | null;

  // Campos adicionales calculados
  paymentsSummary?: {
    totalPaid: number;
  };
  preparationScreens?: string[];
  preparationScreenStatuses?: Array<{
    name: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'READY';
  }>;
  ticketImpressionCount?: number;

  // Información del usuario creador
  createdBy?: {
    username: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}
