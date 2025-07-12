export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKE_AWAY = 'TAKE_AWAY',
  DELIVERY = 'DELIVERY',
}

export enum PreparationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PreparationScreenStatus {
  PENDING = 'PENDING',
  IN_PREPARATION = 'IN_PREPARATION',
  READY = 'READY',
}

export interface KitchenOrderItem {
  id: string;
  productName: string;
  variantName?: string;
  modifiers: string[];
  pizzaCustomizations: Array<{
    customizationName: string;
    action: string;
    half?: string;
  }>;
  preparationNotes?: string;
  preparationStatus: PreparationStatus;
  preparedAt?: string;
  preparedBy?: string;
  preparedByUser?: {
    firstName: string;
    lastName: string;
  };
  createdAt?: string;
  quantity: number;
  belongsToMyScreen: boolean;
}

export interface PreparationScreenStatusInfo {
  screenId: string;
  screenName: string;
  status: PreparationScreenStatus;
  startedAt?: string;
  completedAt?: string;
  startedBy?: {
    firstName: string;
    lastName: string;
  };
}

export interface KitchenOrder {
  id: string;
  shiftOrderNumber: number;
  orderType: OrderType;
  orderStatus: string; // Estado real de la orden
  createdAt: string;
  orderNotes?: string;
  // Campos específicos según tipo
  deliveryAddress?: string;
  deliveryPhone?: string;
  receiptName?: string;
  customerPhone?: string;
  areaName?: string;
  tableName?: string;
  items: KitchenOrderItem[];
  hasPendingItems: boolean;
  screenStatuses: PreparationScreenStatusInfo[];
  myScreenStatus?: PreparationScreenStatus;
}

export interface KitchenFilters {
  orderType?: OrderType;
  showPrepared: boolean;
  showAllProducts: boolean;
  ungroupProducts: boolean;
  screenId?: string;
}

export interface PreparationScreen {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}
