import type { DeliveryInfo } from '../../../app/schemas/domain/delivery-info.schema';

export interface OrderForFinalization {
  id: string;
  dailyNumber: number;
  deliveryInfo: DeliveryInfo;
  orderType: 'TAKEOUT' | 'DELIVERY' | 'DINE_IN';
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
}

export interface OrderItemForFinalization {
  id: string;
  quantity: number;
  basePrice: string;
  finalPrice: string;
  preparationNotes?: string;
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

export type OrderFinalizationFilter = 'takeout' | 'dine_in';
