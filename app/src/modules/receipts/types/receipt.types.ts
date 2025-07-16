import type { OrderType, OrderStatus } from '@/modules/orders/types/orders.types';

// Tipo para la lista optimizada de recibos
export interface ReceiptList {
  id: string;
  shiftOrderNumber: number;
  orderType: OrderType;
  orderStatus: OrderStatus;
  total: number;
  createdAt: string;
  scheduledAt?: string;
  finalizedAt: string;
  notes?: string;
  paymentsSummary?: {
    totalPaid: number;
  };
  table?: {
    id: string;
    number: string;
    name: string;
    isTemporary: boolean;
    area?: {
      name: string;
    };
  };
  deliveryInfo?: {
    recipientName?: string;
    recipientPhone?: string;
    fullAddress?: string;
  };
  preparationScreenStatuses?: Array<{
    name: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'READY';
  }>;
  ticketImpressionCount?: number;
  createdBy?: {
    username: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

// Tipo para el detalle completo del recibo
export interface Receipt {
  id: string;
  shiftOrderNumber: number;
  orderType: OrderType;
  orderStatus: OrderStatus;
  total: number;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
  scheduledAt?: string;
  notes?: string;
  userId?: string;
  tableId?: string;
  customerId?: string;
  isFromWhatsApp?: boolean;
  estimatedDeliveryTime?: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  table?: {
    id: string;
    number: string;
    name: string;
    isTemporary: boolean;
    area?: {
      id: string;
      name: string;
    };
  };
  customer?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  deliveryInfo?: {
    id: string;
    recipientName?: string;
    recipientPhone?: string;
    deliveryInstructions?: string;
    fullAddress?: string;
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
  };
  preparationScreens?: string[];
  orderItems: Array<{
    id: string;
    quantity?: number;
    basePrice: number;
    finalPrice: number;
    preparationNotes?: string;
    preparationStatus?: string;
    product: {
      id: string;
      name: string;
      description?: string;
      price: number;
    };
    productVariant?: {
      id: string;
      name: string;
      price: number;
    };
    productModifiers?: Array<{
      id: string;
      name: string;
      price: number;
    }>;
    selectedPizzaCustomizations?: Array<any>;
  }>;
  payments?: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
  }>;
  adjustments?: Array<{
    id: string;
    type: string;
    amount: number;
    reason?: string;
    createdAt: string;
  }>;
  ticketImpressions?: Array<{
    id: string;
    ticketType: string;
    impressionTime: string;
    user?: {
      id: string;
      firstName?: string;
      lastName?: string;
    };
    printer?: {
      id: string;
      name: string;
    };
  }>;
}

// Respuesta de lista de recibos (sin paginación)
export type ReceiptsListResponse = ReceiptList[];

// Filtros para buscar recibos
export interface ReceiptFilters {
  startDate?: string;
  endDate?: string;
  orderType?: OrderType;
}