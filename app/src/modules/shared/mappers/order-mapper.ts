// app/src/modules/shared/mappers/order-mapper.ts

import { Receipt } from '@/modules/receipts/schema/receipt.schema';
import { OrderForFinalization } from '@/modules/orderFinalization/schema/orderFinalization.schema';
import { Order } from '@/app/schemas/domain/order.schema';
import {
  UnifiedOrderDetails,
  UnifiedOrderItem,
} from '../types/unified-order.types';

// Helper function para mapear un ítem de orden a formato unificado
const mapReceiptItemToUnified = (
  item: Receipt['orderItems'][0],
): UnifiedOrderItem => ({
  id: item.id,
  productName: item.product?.name || 'Producto desconocido',
  variantName: item.productVariant?.name,
  quantity: item.quantity || 1,
  finalPrice:
    typeof item.finalPrice === 'string'
      ? parseFloat(item.finalPrice)
      : item.finalPrice,
  basePrice:
    typeof item.basePrice === 'string'
      ? parseFloat(item.basePrice)
      : item.basePrice,
  preparationStatus: item.preparationStatus,
  preparationNotes: item.preparationNotes,
  modifiers: item.productModifiers?.map((mod) => ({
    id: mod.id,
    name: mod.name,
    price: typeof mod.price === 'string' ? parseFloat(mod.price) : mod.price,
  })),
  selectedPizzaCustomizations: item.selectedPizzaCustomizations,
});

const mapOrderForFinalizationItemToUnified = (item: any): UnifiedOrderItem => ({
  id: item.id,
  productName: item.product?.name || 'Producto desconocido',
  variantName: item.productVariant?.name,
  quantity: item.quantity || 1,
  finalPrice:
    typeof item.finalPrice === 'string'
      ? parseFloat(item.finalPrice)
      : item.finalPrice,
  basePrice:
    typeof item.basePrice === 'string'
      ? parseFloat(item.basePrice)
      : item.basePrice,
  preparationStatus: item.preparationStatus,
  preparationNotes: item.preparationNotes,
  modifiers: item.modifiers?.map((mod: any) => ({
    id: mod.id,
    name: mod.name,
    price: typeof mod.price === 'string' ? parseFloat(mod.price) : mod.price,
  })),
  selectedPizzaCustomizations: item.selectedPizzaCustomizations,
});

const mapDomainOrderItemToUnified = (item: any): UnifiedOrderItem => ({
  id: item.id,
  productName: item.productName || 'Producto desconocido',
  variantName: item.variantName,
  quantity: item.quantity || 1,
  finalPrice: item.totalPrice || item.unitPrice || 0,
  basePrice: item.unitPrice || 0,
  preparationStatus: undefined, // Domain Order no tiene preparation status típicamente
  preparationNotes: item.notes,
  modifiers: item.modifiers?.map((mod: any) => ({
    id: mod.productModifierId,
    name: mod.modifierName,
    price: mod.price,
  })),
  selectedPizzaCustomizations: item.selectedPizzaCustomizations,
});

// Mapper principal para Receipt
export const mapReceiptToUnifiedOrder = (
  receipt: Receipt,
): UnifiedOrderDetails => {
  return {
    id: receipt.id,
    shiftOrderNumber: receipt.shiftOrderNumber,
    orderType: receipt.orderType,
    orderStatus: receipt.orderStatus,
    total:
      typeof receipt.total === 'string'
        ? parseFloat(receipt.total)
        : receipt.total,
    subtotal: receipt.subtotal
      ? typeof receipt.subtotal === 'string'
        ? parseFloat(receipt.subtotal)
        : receipt.subtotal
      : undefined,
    createdAt: receipt.createdAt,
    updatedAt: receipt.updatedAt,
    finalizedAt: receipt.finalizedAt || null,
    scheduledAt: receipt.scheduledAt || null,
    notes: receipt.notes || null,

    // Información del cliente y mesa
    table: receipt.table
      ? {
          id: receipt.table.id,
          name: receipt.table.name,
          number: receipt.table.number,
          area: receipt.table.area
            ? {
                id: receipt.table.area.id,
                name: receipt.table.area.name,
              }
            : undefined,
        }
      : null,

    deliveryInfo: receipt.deliveryInfo
      ? {
          recipientName: receipt.deliveryInfo.recipientName,
          recipientPhone: receipt.deliveryInfo.recipientPhone,
          fullAddress: receipt.deliveryInfo.fullAddress,
          deliveryInstructions: receipt.deliveryInfo.deliveryInstructions,
          street: receipt.deliveryInfo.street,
          number: receipt.deliveryInfo.number,
          interiorNumber: receipt.deliveryInfo.interiorNumber,
          neighborhood: receipt.deliveryInfo.neighborhood,
          city: receipt.deliveryInfo.city,
          state: receipt.deliveryInfo.state,
          zipCode: receipt.deliveryInfo.zipCode,
          country: receipt.deliveryInfo.country,
          latitude: receipt.deliveryInfo.latitude,
          longitude: receipt.deliveryInfo.longitude,
        }
      : null,

    user: receipt.user
      ? {
          id: receipt.user.id,
          firstName: receipt.user.firstName || null,
          lastName: receipt.user.lastName || null,
          username: receipt.user.username || '',
        }
      : null,

    customer: receipt.customer
      ? {
          id: receipt.customer.id,
          name: receipt.customer.name,
          phone: receipt.customer.phone,
          email: receipt.customer.email,
        }
      : null,

    // Datos asociados
    orderItems:
      receipt.orderItems?.map((item) => mapReceiptItemToUnified(item)) || [],

    payments:
      receipt.payments?.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      })) || null,

    ticketImpressions:
      receipt.ticketImpressions?.map((impression) => ({
        id: impression.id,
        ticketType: impression.ticketType,
        impressionTime: impression.impressionTime,
        user: impression.user
          ? {
              id: impression.user.id,
              firstName: impression.user.firstName || null,
              lastName: impression.user.lastName || null,
            }
          : undefined,
        printer: impression.printer
          ? {
              id: impression.printer.id,
              name: impression.printer.name,
            }
          : undefined,
      })) || null,

    adjustments:
      receipt.adjustments?.map((adjustment) => ({
        id: adjustment.id,
        type: adjustment.type,
        amount: adjustment.amount,
        reason: adjustment.reason,
        createdAt: adjustment.createdAt,
      })) || null,

    // Información adicional
    preparationScreenStatuses:
      receipt.preparationScreenStatuses?.map((status: any) => ({
        id: status.id,
        preparationScreenId: status.preparationScreenId,
        preparationScreenName: status.preparationScreenName,
        status: status.status,
        startedAt: status.startedAt,
        completedAt: status.completedAt,
      })) || null,
    isFromWhatsApp: receipt.isFromWhatsApp,
    estimatedDeliveryTime: receipt.estimatedDeliveryTime || null,
    userId: receipt.userId || null,
    tableId: receipt.tableId || null,
    customerId: receipt.customerId || null,
  };
};

// Mapper para OrderForFinalization
export const mapOrderForFinalizationToUnifiedOrder = (
  order: OrderForFinalization,
): UnifiedOrderDetails => {
  return {
    id: order.id,
    shiftOrderNumber: order.shiftOrderNumber,
    orderType: order.orderType,
    orderStatus: order.orderStatus,
    total:
      typeof order.total === 'string' ? parseFloat(order.total) : order.total,
    subtotal: undefined, // OrderForFinalization no tiene subtotal típicamente
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    finalizedAt: null, // Orders for finalization no están finalizadas aún
    scheduledAt: order.scheduledAt || null,
    notes: order.notes || null,

    // Información del cliente y mesa
    table: order.table
      ? {
          id: order.table.id,
          name: order.table.number, // OrderForFinalization usa 'number' en lugar de 'name'
          number: order.table.number,
          area: order.table.area
            ? {
                name: order.table.area.name,
              }
            : undefined,
        }
      : null,

    deliveryInfo: order.deliveryInfo
      ? {
          recipientName: order.deliveryInfo.recipientName,
          recipientPhone: order.deliveryInfo.recipientPhone,
          fullAddress: order.deliveryInfo.fullAddress,
        }
      : null,

    user: order.user
      ? {
          id: order.user.id,
          firstName: order.user.firstName || null,
          lastName: order.user.lastName || null,
          username: '',
        }
      : null,

    // Datos asociados
    orderItems:
      order.orderItems?.map((item) =>
        mapOrderForFinalizationItemToUnified(item),
      ) || [],

    payments:
      order.payments?.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      })) || null,

    ticketImpressions:
      order.ticketImpressions?.map((impression) => ({
        id: impression.id,
        ticketType: impression.ticketType,
        impressionTime: impression.impressionTime,
        user: impression.user
          ? {
              id: impression.user.id,
              firstName: impression.user.firstName || null,
              lastName: impression.user.lastName || null,
            }
          : undefined,
        printer: impression.printer
          ? {
              id: impression.printer.id,
              name: impression.printer.name,
            }
          : undefined,
      })) || null,

    // Información adicional
    preparationScreenStatuses:
      order.preparationScreenStatuses?.map((status: any) => ({
        id: status.id,
        preparationScreenId: status.preparationScreenId,
        preparationScreenName: status.preparationScreenName,
        status: status.status,
        startedAt: status.startedAt,
        completedAt: status.completedAt,
      })) || null,
    isFromWhatsApp: order.isFromWhatsApp,
    tableId: order.tableId || null,
  };
};

// Mapper para Order (domain)
export const mapOrderToUnifiedOrder = (order: Order): UnifiedOrderDetails => {
  return {
    id: order.id,
    shiftOrderNumber: order.shiftOrderNumber,
    orderType: order.orderType,
    orderStatus: order.orderStatus,
    total: order.total || 0,
    subtotal: order.subtotal,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    finalizedAt: order.finalizedAt,
    scheduledAt: order.scheduledAt,
    notes: order.notes,

    // Información del cliente y mesa
    table: order.table
      ? {
          id: order.table.id,
          name: order.table.name,
          number: order.table.name,
          area: order.table.area
            ? {
                id: order.table.area.id,
                name: order.table.area.name,
              }
            : undefined,
        }
      : null,

    deliveryInfo: order.deliveryInfo
      ? {
          recipientName: order.deliveryInfo.recipientName,
          recipientPhone: order.deliveryInfo.recipientPhone,
          fullAddress: order.deliveryInfo.fullAddress,
          deliveryInstructions: order.deliveryInfo.deliveryInstructions,
          street: order.deliveryInfo.street,
          number: order.deliveryInfo.number,
          interiorNumber: order.deliveryInfo.interiorNumber,
          neighborhood: order.deliveryInfo.neighborhood,
          city: order.deliveryInfo.city,
          state: order.deliveryInfo.state,
          zipCode: order.deliveryInfo.zipCode,
          country: order.deliveryInfo.country,
          latitude: order.deliveryInfo.latitude,
          longitude: order.deliveryInfo.longitude,
        }
      : null,

    user: order.user
      ? {
          id: order.user.id,
          firstName: order.user.firstName || null,
          lastName: order.user.lastName || null,
          username: order.user.username || '',
        }
      : null,

    // Datos asociados
    orderItems:
      order.orderItems?.map((item) => mapDomainOrderItemToUnified(item)) || [],

    payments:
      order.payments?.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt || payment.createdAt,
      })) || null,

    adjustments:
      order.adjustments?.map((adjustment) => ({
        id: adjustment.id,
        type: adjustment.isPercentage ? 'PERCENTAGE' : 'DISCOUNT',
        amount: adjustment.amount,
        reason: adjustment.name,
        createdAt: adjustment.createdAt,
      })) || null,

    // Información adicional
    isFromWhatsApp: order.isFromWhatsApp,
    estimatedDeliveryTime: order.estimatedDeliveryTime,
    userId: order.userId,
    tableId: order.tableId,
    deletedAt: order.deletedAt,
  };
};
