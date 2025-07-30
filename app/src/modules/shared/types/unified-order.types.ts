// app/src/modules/shared/types/unified-order.types.ts

import {
  OrderStatus,
  OrderType,
  SelectedPizzaCustomization,
} from '@/app/schemas/domain/order.schema';

// Interfaz para un item de orden unificado
export interface UnifiedOrderItem {
  id: string;
  productName: string;
  variantName?: string;
  quantity: number;
  finalPrice: number;
  basePrice: number;
  preparationStatus?: string;
  preparationNotes?: string;
  modifiers?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  selectedPizzaCustomizations?: SelectedPizzaCustomization[];
}

// Interfaz principal unificada para los detalles de la orden
export interface UnifiedOrderDetails {
  id: string;
  shiftOrderNumber: number;
  orderType: OrderType;
  orderStatus: OrderStatus;
  total: number;
  subtotal?: number;
  createdAt: string | Date;
  updatedAt?: string | Date;
  finalizedAt?: string | Date | null;
  scheduledAt?: string | Date | null;
  notes?: string | null;

  // Información del cliente y mesa
  table?: {
    id?: string;
    name?: string;
    number?: string;
    area?: {
      id?: string;
      name: string;
    };
  } | null;
  deliveryInfo?: {
    recipientName?: string;
    recipientPhone?: string;
    fullAddress?: string;
    deliveryInstructions?: string;
    street?: string;
    number?: string;
    interiorNumber?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  } | null;
  user?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string;
  } | null;
  customer?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  } | null;

  // Listas de datos asociados
  orderItems: UnifiedOrderItem[];
  payments?: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
    createdAt: string | Date;
    updatedAt?: string | Date;
  }> | null;
  ticketImpressions?: Array<{
    id: string;
    ticketType: string;
    impressionTime: string | Date;
    user?: {
      id?: string;
      firstName?: string | null;
      lastName?: string | null;
    };
    printer?: {
      id?: string;
      name: string;
    };
  }> | null;
  adjustments?: Array<{
    id: string;
    type: string;
    amount: number;
    reason?: string;
    createdAt: string | Date;
  }> | null;

  // Información adicional
  preparationScreens?: string[] | null;
  preparationScreenStatuses?: Array<{
    name: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'READY';
  }> | null;
  paymentsSummary?: {
    totalPaid: number;
  } | null;
  isFromWhatsApp?: boolean;
  estimatedDeliveryTime?: string | Date | null;
  userId?: string | null;
  tableId?: string | null;
  customerId?: string | null;
  deletedAt?: string | null;
}
