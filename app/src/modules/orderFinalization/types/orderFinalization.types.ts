import type { DeliveryInfo } from '../../../app/schemas/domain/delivery-info.schema';

// Tipo ligero para la lista de órdenes (optimizado)
export interface OrderForFinalizationList {
  id: string;
  shiftOrderNumber: number;
  orderType: 'TAKE_AWAY' | 'DELIVERY' | 'DINE_IN';
  orderStatus:
    | 'PENDING'
    | 'IN_PROGRESS'
    | 'READY'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'CANCELLED';
  total: string | number;
  createdAt: string;
  scheduledAt?: string;
  paymentsSummary?: {
    totalPaid: number;
  };
  deliveryInfo?: {
    recipientName?: string;
    recipientPhone?: string;
    fullAddress?: string;
  };
  preparationScreens?: string[];
  preparationScreenStatuses?: Array<{
    name: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'READY';
  }>;
  ticketImpressionCount?: number;
  notes?: string;
  table?: {
    number: string;
    name: string;
    isTemporary: boolean;
    area?: {
      name: string;
    };
  };
  createdBy?: {
    username: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  isFromWhatsApp?: boolean;
}

// Tipo completo para el detalle de orden
export interface OrderForFinalization {
  id: string;
  shiftOrderNumber: number;
  deliveryInfo: DeliveryInfo;
  orderType: 'TAKE_AWAY' | 'DELIVERY' | 'DINE_IN';
  orderStatus:
    | 'PENDING'
    | 'IN_PROGRESS'
    | 'READY'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'CANCELLED';
  total: string | number;
  orderItems: OrderItemForFinalization[];
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string;
  tableId?: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  table?: {
    id: string;
    number: string;
    area?: {
      name: string;
    };
  } | null;
  isFromWhatsApp?: boolean;
  preparationScreens?: string[];
  payments?: {
    id: string;
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
  }[];
  notes?: string;
  ticketImpressions?: {
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
  }[];
}

export interface OrderItemForFinalization {
  id: string;
  quantity: number;
  basePrice: string;
  finalPrice: string;
  preparationNotes?: string;
  preparationStatus?: string;
  product: {
    id: string;
    name: string;
    description?: string;
  };
  productVariant?: {
    id: string;
    name: string;
  } | null;
  modifiers: OrderItemModifierForFinalization[];
  selectedPizzaCustomizations?: any[];
}

export interface OrderItemModifierForFinalization {
  id: string;
  name: string;
  price: number | string;
}

export interface OrderSelectionState {
  selectedOrders: Set<string>;
  totalAmount: number;
}

export interface FinalizeOrdersPayload {
  orderIds: string[];
  paymentMethod?: string;
  notes?: string;
}

export type OrderFinalizationFilter = 'delivery' | 'take_away' | 'dine_in';
